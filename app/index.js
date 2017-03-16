import React, { Component } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import MapView from 'react-native-maps';
import SocketIOClient from 'socket.io-client';
import haversine from 'haversine';
import shortid from 'shortid';

class App extends Component {
    constructor(props) {
        super(props);

        // Default State
        this.state = {
            started: false,
            initialPosition: null,
            position: null,
            distance: 0,
            users: {},
            count: 1,
            path: [],
            icons: [],
            panning: false
        }

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
                <MapView ref={ref => {this.map = ref}} style={[styles.map]} showsPointsOfInterest={false} onPanDrag={this.panningMap}>
                    {this.state.initialPosition && !this.state.started &&
                        <MapView.Marker coordinate={this.state.initialPosition.coords}>
                            <View style={[styles.circle, styles.iCircle]}></View>
                        </MapView.Marker>
                    }
                    {this.getMarkers()}
                    <MapView.Polyline coordinates={this.state.path} strokeWidth={5} strokeColor={colors.user} />
                </MapView>
                <View style={[styles.container]} pointerEvents='box-none'>
                    <Text style={[styles.debug]}>{this.state.count} {this.getAccuracy()}</Text>
                    <Text style={[styles.debug, {bottom: 120, top: null}]} onPress={this.stopPanning}>Re-center</Text>
                    {this.getBottom()}
                </View>
            </View>
        )
    }

    // Get Markers to Draw
    getMarkers = () => {
        this.markers = [];
        Object.entries(this.state.users).forEach((data, key) => {
            var serverId = data[0],
                user = data[1],
                mText = user.id === this.userId ? 'ME' : 'X';

            this.markers.push(
                <MapView.Marker key={key} coordinate={user.position.coords}>
                    <View style={[styles.circle]}>
                        <Text style={[styles.markerText]}>{mText}</Text>
                    </View>
                </MapView.Marker>
            )
        })
        return this.markers;
    }

    // Bottom View
    getBottom = () => {
        if (this.state.started && this.state.position) {
            return (
                <View style={[styles.details]}>
                    <Text style={[styles.user, {marginBottom: 10}]} onPress={this.stopRouting}>STOP</Text>
                    <View style={styles.data}>
                        <Text style={styles.speed}>{Math.abs(Math.round(this.state.position.coords.speed * 2.23694))} MPH</Text>
                        <Text style={styles.speed}>{this.state.distance.toFixed(1)} MILES</Text>
                    </View>
                </View>
            )
        }

        return (
            <View style={[styles.details]}>
                <Text style={styles.user} onPress={this.startRouting}>START</Text>
            </View>
        );
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
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01
                        })
                    }
                } else {
                    // Group Ride Started
                    this.socket.emit('location', JSON.stringify({
                        id: this.userId,
                        position: position,
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
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01
                            })
                        } else {
                            this.map.fitToCoordinates(this.state.icons, {edgePadding: {top: 50, left: 30, right: 30, bottom: 130}})
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
    }

    // Drop Group Ride
    stopRouting = () => {
        this.setState({
            started: false,
            users: {},
            path: [],
            position: null
        })
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
        this.setState({panning: true})
    }

    // Follow users again
    stopPanning = () => {
        this.setState({panning: false})
    }
}

const colors = {
    user: '#1abc9c'
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
    iCircle: {
        height: 20,
        width: 20,
        borderRadius: 20,
        borderWidth: 3,
        backgroundColor: '#3498db',
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowOpacity: .5
    },
    circle: {
        height: 35,
        width: 35,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: colors.user,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,.75)'
    },
    markerText: {
        color: colors.user,
        fontSize: 14,
        fontWeight: 'bold'
    },
    details: {
        flex: 1,
        height: 120,
        // margin: 20,
        padding: 15,
        // borderRadius: 5,
        borderTopWidth: 1,
        borderColor: colors.user,
        backgroundColor: 'rgba(255,255,255,.95)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    data: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    user: {
        color: colors.user,
        fontSize: 22
    },
    speed: {
        color: colors.user,
        fontSize: 16,
        marginHorizontal: 10
    }
});

module.exports = App;
