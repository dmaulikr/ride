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
            distance: 0,
            users: {},
            count: 1,
            path: []
        }

        // Unique ID
        this.userId = shortid.generate();
        this.startSocketConn();
    }

    componentDidMount() {
        this.startGPS();
    }

    render() {
        if (!this.state.position) {
            return null;
        }
        return (
            <View style={{flex: 1}}>
                <MapView ref={ref => {this.map = ref}} style={[styles.map]}>
                    {this.getMarkers()}
                    <MapView.Polyline coordinates={this.state.path} strokeWidth={5} strokeColor={colors.user} />
                </MapView>
                <View style={[styles.container]} pointerEvents='box-none'>
                    <View style={[styles.details]}>
                        <Text style={styles.user}>HIMANSHU</Text>
                        <View style={styles.data}>
                            <Text style={styles.speed}>{Math.abs(Math.round(this.state.position.coords.speed * 2.23694))} MPH</Text>
                            <Text style={styles.speed}>{this.state.distance.toFixed(1)} MILES</Text>
                            <Text>{this.state.count}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    ////////////////// Custom Functions

    startSocketConn = () => {
        window.navigator.userAgent = "react-native";
        // this.socket = SocketIOClient('http://10.0.1.51:8080', {jsonp: false});
        this.socket = SocketIOClient('ws://ride-apph.rhcloud.com:8000', {jsonp: false});
        this.socket.on('connect', data => {
            console.log('Socket connection started!');
        });
        this.socket.on('locations', users => {
            this.setState({users: JSON.parse(users)})
        });
        this.socket.on('connect_error', err => {
            console.log('Socket connection failed!', err);
        })
    }

    startGPS = () => {
        this.watchID = navigator.geolocation.watchPosition(
            (position) => {
                // Set new position
                this.setState({
                    count: this.state.count + 1,
                    position: position,
                    distance: this.state.distance + this.calcDistance(position.coords),
                    path: [...this.state.path, position.coords]
                });

                // Move Markers and stuff
                this.map.fitToElements(true);

                // Send position to server
                this.socket.emit('location', JSON.stringify({
                    id: this.userId,
                    position: position,
                    distance: this.state.distance
                }))
            },
            (error) => {
                Alert.alert('Failed to get location!')
            },
            {enableHighAccuracy: true, timeout: 5000, maximumAge: 0, distanceFilter: 0}
        );
    }

    calcDistance = (newLatLng) => {
        if (this.state.position) {
            let prevLatLng = this.state.position.coords
            return (haversine(prevLatLng, newLatLng, {unit: 'mile'}) || 0)
        }
        return 0;
    }

    onRegionChange = (region) => {
        this.setState({region})
    }

    getMarkers = () => {
        var markers = [];
        Object.entries(this.state.users).forEach((data, key) => {
            var serverId = data[0],
                user = data[1],
                mText = user.id === this.userId ? 'ME' : 'X';

            markers.push(
                <MapView.Marker key={key} coordinate={user.position.coords}>
                    <View style={[styles.circle]}>
                        <Text style={[styles.markerText]}>{mText}</Text>
                    </View>
                </MapView.Marker>
            )
        })
        return markers;
    }
}

const colors = {
    user: '#9b59b6'
}
const styles = StyleSheet.create({
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
        // top: -10,
        // left: -10,
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
        // width: 200,
        height: 120,
        margin: 20,
        // marginBottom: 50,
        padding: 15,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors.user,
        backgroundColor: 'rgba(255,255,255,.90)',
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
        fontSize: 22,
        marginBottom: 10
    },
    speed: {
        color: colors.user,
        fontSize: 16,
        marginHorizontal: 10
    }
});

module.exports = App;
