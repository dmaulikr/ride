import React, { Component } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import SocketIOClient from 'socket.io-client';
import haversine from 'haversine';
import shortid from 'shortid';

import { mapStyle } from 'app/map';

const colors = [
    '#2ecc71',
    '#3498db',
    '#9b59b6',
    '#e74c3c',
    '#34495e',
    '#e67e22',
];

const regionUS = {
    latitude: 36.8282,
    longitude: -98.5795,
    latitudeDelta: 40,
    longitudeDelta: 40
};

const startState = {
    started: false,
    initialPosition: null,
    position: null,
    distance: 0,
    users: {},
    count: 1,
    path: [],
    icons: [],
    timer: null,
    panning: false,
    showTraffic: false
};

// App Starts Here
class App extends Component {
    constructor(props) {
        super(props);

        // Default State
        this.state = startState;

        // Unique ID
        this.userId = shortid.generate();
    }

    componentDidMount() {
        this.startConn();
        this.loadMap();
    }

    // Render App
    render() {
        return (
            <View style={{flex: 1}}>
                <MapView ref={ref => {this.map = ref}} style={[styles.map]} showsPointsOfInterest={false}
                    provider={PROVIDER_GOOGLE} customMapStyle={mapStyle} showsTraffic={this.state.showTraffic}
                    onPanDrag={this.panningMap} onPress={this.panningMap} initialRegion={regionUS}>
                    {this.getMarkers()}
                    {this.getPaths()}
                </MapView>
                <View style={[styles.container]} pointerEvents='box-none'>
                    <Text style={[styles.debug]}>{this.state.count} {this.getAccuracy()}</Text>
                    <Text style={[styles.debug, {left: 5, right: null}]} onPress={this.stopPanning}>RESUME</Text>
                    {this.getBottom()}
                </View>
            </View>
        )
    }

    // Get Markers to Draw
    getMarkers = () => {
        if (this.state.initialPosition && !this.state.started) {
            return (
                <MapView.Marker coordinate={this.state.initialPosition.coords} anchor={{x: .60, y: .60}}>
                    <View style={[styles.circle]}></View>
                </MapView.Marker>
            )
        }

        this.markers = [];
        Object.entries(this.state.users).forEach((data, key) => {
            var serverId = data[0],
                user = data[1];

            this.markers.push(
                <MapView.Marker key={key} coordinate={user.position.coords} anchor={{x: .60, y: .60}}>
                    <View style={[styles.circle, {borderColor: user.color}]}></View>
                </MapView.Marker>
            )
        })
        return this.markers;
    }


    getPaths = () => {
        if (this.state.path.length) {
            return <MapView.Polyline coordinates={this.state.path} strokeWidth={4} strokeColor={colors[0]} />
        }

        return null;
    }

    // Bottom View
    getBottom = () => {
        if (this.state.started && this.state.position) {
            return (
                <View style={[styles.details]}>
                    <Text style={[styles.user, {marginBottom: 10}]} onPress={this.stopRouting}>STOP</Text>
                    <View style={[styles.data]}>
                        <Text style={styles.dataItem}>USER</Text>
                        <Text style={styles.dataItem}>SPEED</Text>
                        <Text style={styles.dataItem}>DISTANCE</Text>
                        <Text style={styles.dataItem}>TIME</Text>
                    </View>
                    {this.getUserStats()}
                </View>
            )
        }

        return (
            <View style={[styles.details]}>
                <Text style={styles.user} onPress={this.startRouting}>START</Text>
            </View>
        );
    }

    // User Stats
    getUserStats = () => {
        var stats = [];
        Object.entries(this.state.users).forEach((data, key) => {
            var serverId = data[0],
                user = data[1];

            stats.push(
                <View key={key} style={styles.data}>
                    <Text style={[styles.dataItem]}>{key+1}</Text>
                    <Text style={[styles.dataItem]}>{Math.abs(Math.ceil(user.position.coords.speed * 2.23694))}</Text>
                    <Text style={[styles.dataItem]}>{user.distance.toFixed(1)}</Text>
                    <Text style={[styles.dataItem]}>{user.timer}</Text>
                </View>
            )
        })
        return stats;
    }

    ////////////////// Custom Functions

    // Connect to server
    startConn = () => {
        window.navigator.userAgent = "react-native";
        // this.socket = SocketIOClient('http://10.0.1.51:8080', {jsonp: false});
        this.socket = SocketIOClient('ws://ride-apph.rhcloud.com:8000', {jsonp: false});
        this.socket.on('connect', data => {
            console.log('Socket connection started!');
        });
        this.socket.on('locations', users => {
            var userss = JSON.parse(users),
                icons = [];

            // Icon Lat Longs
            Object.entries(userss).forEach((data, key) => {
                var user = data[1];
                icons.push(user.position.coords);
                return;
            });

            this.setState({
                icons: icons,
                users: userss
            });
        });
        this.socket.on('connect_error', err => {
            console.log('Socket connection failed!', err);
        })
    }

    // Load Initial Map
    loadMap = () => {
        navigator.geolocation.watchPosition(
            (position) => {
                // Not in a group ride yet
                if (!this.state.started) {
                    this.setState({
                        initialPosition: position,
                        count: this.state.count + 1
                    });

                    if (!this.state.panning) {
                        this.map.animateToRegion({
                            ...position.coords,
                            latitudeDelta: 0.04,
                            longitudeDelta: 0.04
                        })
                    }
                } else {
                    // Group Ride Started
                    this.socket.emit('location', JSON.stringify({
                        id: this.userId,
                        color: colors[0],
                        position: position,
                        timer: this.state.timer,
                        distance: this.state.distance
                    }));
                    this.setState({
                        position: position,
                        count: this.state.count + 1,
                        distance: this.state.distance + this.calcDistance(position.coords),
                        path: [...this.state.path, position.coords]
                    });

                    // Only self visible
                    if (!this.state.panning) {
                        if (this.markers.length < 2) {
                            this.map.animateToRegion({
                                ...position.coords,
                                latitudeDelta: 0.02,
                                longitudeDelta: 0.02
                            })
                        } else {
                            this.map.fitToCoordinates(this.state.icons, {edgePadding: {top: 50, left: 50, right: 50, bottom: 150}})
                        }
                    }
                }
            },
            (error) => {
                console.log('Failed to get location!')
            },
            {enableHighAccuracy: true, timeout: 5000, maximumAge: 0, distanceFilter: 0}
        );
    }

    // Join Group Ride
    startRouting = () => {
        this.setState({started: true})
        this.startTimer();
    }

    // Drop Group Ride
    stopRouting = () => {
        this.setState(startState)
    }

    startTimer = () => {
        var sec = 0;
        function pad ( val ) { return val > 9 ? val : "0" + val; }
        this.timer = setInterval(() => {
            this.setState({
                timer: parseInt(sec/60,10) + ':' + pad(++sec%60)
            })
        }, 1000);
    }

    // Get GPS Accuracy
    getAccuracy = () => {
        if (this.state.position) {
            return this.state.position.coords.accuracy;
        }

        if (this.state.initialPosition) {
            return this.state.initialPosition.coords.accuracy;
        }

        return '';
    }

    // Calculate Distance between two lat longs
    calcDistance = (newLatLng) => {
        if (this.state.position) {
            let prevLatLng = this.state.position.coords
            return (haversine(prevLatLng, newLatLng, {unit: 'mile'}) || 0)
        }
        return 0;
    }

    // Map Move
    panningMap = (region) => {
        console.log('panning');
        this.setState({panning: true})
    }

    // Follow users again
    stopPanning = () => {
        this.setState({panning: false})
    }
}

const styles = StyleSheet.create({
    debug: {
        position: 'absolute',
        top: 20,
        right: 5,
        color: '#000',
        backgroundColor: 'transparent'
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject
    },
    circle: {
        height: 20,
        width: 20,
        borderRadius: 20,
        borderWidth: 3,
        backgroundColor: '#ffffff',
        borderColor: '#3498db',
    },
    markerText: {
        color: colors[0],
        fontSize: 14,
        fontWeight: 'bold'
    },
    details: {
        flex: 1,
        margin: 8,
        padding: 15,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors[0],
        backgroundColor: 'rgba(255,255,255,.95)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    data: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    dataItem: {
        flex: 1,
        color: '#444',
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 8
    },
    userData: {
        fontWeight: '300',
        marginBottom: 4
    },
    user: {
        color: colors[0],
        fontSize: 22
    },
});

module.exports = App;
