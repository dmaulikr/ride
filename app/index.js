import React, { Component } from 'react';
import { Alert, Text, View, PanResponder } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import SocketIOClient from 'socket.io-client';
import haversine from 'haversine';

import { Button } from 'app/components/button';
import { mapStyle } from 'app/map';
import { styles } from 'app/styles';

const regionUS = {
    latitude: 36.8282,
    longitude: -98.5795,
    latitudeDelta: 40,
    longitudeDelta: 40
};

const defaultState = {
    panning: false,
    initialPosition: null,
    showTraffic: false,
    inGroup: true,

    // while moving
    started: false,
    start: null,
    position: null,
    distance: 0,
    users: {},
    path: [], // paths for current user
    icons: [], // markers for all users

    color: '#3498db', // user default color
    group: 'knightrider',
    pass: '2006',
    name: 'Himanshu'
};


class App extends Component {
    /**
     * Set the default state
     */
    constructor(props) {
        super(props);

        this.state = defaultState;
    }

    /**
     * Get everything ready for app
     * @return undefined
     */
    componentWillMount() {
        this.addEvents();
        this.startConn();
        this.loadMap();
    }

    /**
     * Render App Display
     * @return undefined
     */
    render() {
        return (
            <View style={styles.app}>
                <MapView ref={ref => {this.map = ref}} style={[styles.map]} {...this._panResponder.panHandlers}
                    provider={PROVIDER_GOOGLE} customMapStyle={mapStyle} showsTraffic={this.state.showTraffic}
                    showsPointsOfInterest={false} initialRegion={regionUS}>
                    {this.getMarkers()}
                    {this.getPaths()}
                </MapView>
                <View style={[styles.container]} pointerEvents='box-none'>
                    <Text style={[styles.version]}>v095</Text>
                    {this.getBottom()}
                </View>
            </View>
        )
    }

    /**
     * Markers to draw on map
     * @return undefined
     */
    getMarkers = () => {
        // Not in a ride, display location marker
        if (this.state.initialPosition && !this.state.started) {
            return (
                <MapView.Marker coordinate={this.state.initialPosition.coords} anchor={{x: .60, y: .60}}>
                    <View style={[styles.circle]}></View>
                </MapView.Marker>
            )
        }

        // In a ride, display all markers
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

    /**
     * Get paths to draw on map
     * @return undefined
     */
    getPaths = () => {
        var paths = [];
        Object.entries(this.state.users).forEach((data, key) => {
            var serverId = data[0],
                user = data[1];

            paths.push(<MapView.Polyline key={key} coordinates={user.path} strokeWidth={4} strokeColor={user.color} />);
        })

        return paths;
    }


    /**
     * Render bottom view that goes on top of map
     * @return undefined
     */
    getBottom = () => {
        // In a ride, display markers, speed, etcc for all users
        if (this.state.started) {
            return (
                <View style={[styles.bottom]} pointerEvents='box-none'>
                    {this.state.panning &&
                    <Icon style={[styles.locationButton]} name="ios-locate-outline" size={32} color="#444" onPress={this.stopPanning} />
                    }
                    <View style={[styles.data]} pointerEvents='box-none'>
                        <Text style={[styles.groupName]}>#{this.state.group}</Text>
                        <Button textStyle={[styles.buttonText, styles.stopText]} style={[styles.button, styles.stopButton]} onPress={this.stopRouting}>STOP</Button>
                    </View>
                    <View style={[styles.details]}>
                        <View style={[styles.data]}>
                            <Text style={[styles.dataItem, styles.dataItemUser]}>USER</Text>
                            <Text style={styles.dataItem}>SPEED</Text>
                            <Text style={styles.dataItem}>DISTANCE</Text>
                            <Text style={styles.dataItem}>TIME</Text>
                        </View>
                        {this.getUserStats()}
                    </View>
                </View>
            )
        }

        // Resume group ride, if previously joined
        if (this.state.inGroup) {
            <View style={[styles.bottom]} pointerEvents='box-none'>
                <Button textStyle={styles.buttonText} style={styles.button} onPress={this.startRouting}>START</Button>
            </View>
        }

        // Default: Not in a ride, show join
        return (
            <View style={[styles.bottom]} pointerEvents='box-none'>
                {this.state.panning &&
                <Icon style={[styles.locationButton]} name="ios-locate-outline" size={32} color="#444" onPress={this.stopPanning} />
                }
                <Button textStyle={styles.buttonText} style={styles.button} onPress={this.joinGroup}>JOIN GROUP</Button>
            </View>
        );
    }

    /**
     * Display user details, stats etc
     * @return undefined
     */
    getUserStats = () => {
        if (!this.state.position) {
            return null;
        }

        // Display Stats for Users
        var stats = [];
        Object.entries(this.state.users).forEach((data, key) => {
            var serverId = data[0],
                user = data[1];

            stats.push(
                <View key={key} style={styles.data}>
                    <Text style={[styles.dataItem, styles.dataItemUser]}>{user.name}</Text>
                    <Text style={[styles.dataItem]}>{Math.abs(Math.ceil(user.position.coords.speed * 2.23694))}</Text>
                    <Text style={[styles.dataItem]}>{user.distance.toFixed(1)}</Text>
                    <Text style={[styles.dataItem]}>{this.getTime(user.start)}</Text>
                </View>
            )
        })
        return stats;
    }

    ////////////////// Custom Functions

    // Add Events
    addEvents = () => {
        this._panResponder = PanResponder.create({
            onMoveShouldSetPanResponder:(evt, gestureState) => true,
            onPanResponderMove: (evt, gestureState) => {
                this.panningMap();
            }
        });
    }

    // Connect to server
    startConn = () => {
        window.navigator.userAgent = "react-native";
        // this.socket = SocketIOClient('http://10.0.1.51:8080', {jsonp: false});
        this.socket = SocketIOClient('ws://ride-apph.rhcloud.com:8000', {jsonp: false});
        this.socket.on('connect', data => {
            console.log('Socket connection started!');
        });

        // Receiving Locations Updates
        this.socket.on('locations', users => {
            var users = JSON.parse(users),
                icons = [];

            // Where are all the markers (users) - lat / lon
            Object.entries(users).forEach((data, key) => {
                var user = data[1];
                icons.push(user.position.coords);
            });

            this.setState({
                icons: icons,
                users: users
            });
        });

        // Failed on password error
        this.socket.on('group_join_failed', message => {
            this.setState({
                waiting: false
            })
            Alert.alert('Failed to join group, please check password!');
        });

        // Group Join Successful
        this.socket.on('group_join_success', data => {
            var data = JSON.parse(data);
            this.setState({
                color: data.color,
                waiting: false
            });
            this.startRouting();
        })

        // Group Join Successful
        this.socket.on('group_created', data => {
            var data = JSON.parse(data);
            this.setState({
                color: data.color,
                waiting: false
            });
            this.startRouting();
        })

        // Failed to connect!!
        this.socket.on('connect_error', err => {
            console.log('Socket connection failed!', err);
        })
    }

    // Initiate Group Join
    joinGroup = () => {
        if (this.socket.connected) {
            this.setState({
                waiting: true
            })
            this.socket.emit('join_group', JSON.stringify({
                name: this.state.group,
                pass: this.state.pass
            }));
        } else {
            Alert.alert("Connection Error", "Failed to connect to server. Please check your internet connection and try again!");
        }
    }

    // Load Initial Map
    loadMap = () => {
        navigator.geolocation.watchPosition(
            (position) => {
                // Not in a group ride yet
                if (!this.state.started) {
                    this.setState({
                        initialPosition: position
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
                        name: this.state.name,
                        start: this.state.start,
                        position: position,
                        color: this.state.color,
                        group: this.state.group,
                        distance: this.state.distance,
                        path: [...this.state.path, position.coords]
                    }));
                    this.setState({
                        position: position,
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
        this.setState({
            started: true,
            start: Date.now()
        })
    }

    // Drop Group Ride
    stopRouting = () => {
        this.socket.emit('stop_location', 'stop');
        this.setState(defaultState);
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

    // Get Time
    getTime = (timestamp) => {
        var diff = (Date.now() - timestamp) / 1000;
        var secs = Math.round(diff % 60);
        secs = secs == 60 ? 0 : secs;
        secs = secs < 10 ? '0' + secs : secs;
        diff = Math.floor(diff / 60);
        var mins = Math.round(diff % 60);
        diff = Math.floor(diff / 60);
        var hours = Math.round(diff % 24);
        if (hours > 0 && mins < 10) {
            mins = '0' + mins;
        }
        return ((hours > 0 ? (hours+':') : '') + mins + ':' + secs);
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
        if (this.state.panning) {
            return;
        }

        this.setState({panning: true})
    }

    // Follow users again
    stopPanning = () => {
        this.setState({panning: false})
    }
}

module.exports = App;
