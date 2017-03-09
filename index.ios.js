/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { Alert, AppRegistry, StyleSheet, Text, View } from 'react-native';

import MapView from 'react-native-maps';
import SocketIOClient from 'socket.io-client';
import haversine from 'haversine';
import codePush from 'react-native-code-push';
import shortid from 'shortid';


const markerIDs = ['Marker1'];

export default class ride extends Component {
    constructor(props) {
        super(props);

        // Default State
        this.state = {
            distance: 0,
            users: {}
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
                <MapView ref={ref => {this.map = ref}} style={[styles.map]} region={this.state.region} onRegionChange={this.onRegionChange}>
                    {this.getMarkers()}
                </MapView>
                <View style={[styles.container]} pointerEvents='box-none'>
                    <View style={[styles.details]}>
                        <Text style={styles.user}>HIMANSHU</Text>
                        <View style={styles.data}>
                            <Text style={styles.speed}>{Math.round(this.state.position.coords.speed * 2.23694)} MPH</Text>
                            <Text style={styles.speed}>{this.state.distance.toFixed(1)} MILES</Text>
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
                    position: position,
                    distance: this.state.distance + this.calcDistance(position.coords),
                });
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
        height: 35,
        width: 35,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#d35400',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,.75)'
    },
    markerText: {
        color: '#d35400',
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
        borderColor: '#d35400',
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
        color: '#d35400',
        fontSize: 22,
        marginBottom: 10
    },
    speed: {
        color: '#d35400',
        fontSize: 16,
        marginHorizontal: 10
    }
});

AppRegistry.registerComponent('ride', () => codePush(ride));
