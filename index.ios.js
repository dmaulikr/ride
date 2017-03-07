/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';
import MapView from 'react-native-maps';
import haversine from 'haversine';
import codePush from "react-native-code-push";

export default class ride extends Component {
    constructor(props) {
        super(props);

        this.state = {
            distanceTraveled: 0
        }
    }

    componentDidMount() {
        this.watchID = navigator.geolocation.watchPosition((position) => {
            this.setState({
                position: position,
                distanceTraveled: this.state.distanceTraveled + this.calcDistance(position.coords),
            });

            // Follow Map
            if (position.coords) {
                this.setState({
                    region: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        latitudeDelta: 0.10,
                        longitudeDelta: 0.10
                    }
                })
            }
        },{
            enableHighAccuracy: false,
            timeout: 250,
            maximumAge: 0
        });
    }

    calcDistance(newLatLng) {
        if (this.state.position) {
            let prevLatLng = this.state.position.coords
            return (haversine(prevLatLng, newLatLng, {unit: 'mile'}) || 0)
        }
        return 0;
    }

    render() {
        if (!this.state.position) {
            return null;
        }
        return (
            <View style={{flex: 1}}>
                <MapView ref={ref => {this.map = ref}} style={[styles.map]} region={this.state.region} onRegionChange={this.onRegionChange}>
                    <MapView.Marker coordinate={this.state.position.coords}>
                        <View style={[styles.circle]}>
                            <Text style={[styles.markerText]}>HC</Text>
                        </View>
                    </MapView.Marker>
                </MapView>
                <View style={[styles.container]}>
                    <View style={[styles.details]}>
                        <Text style={styles.user}>HIMANSHU</Text>
                        <View style={styles.data}>
                            <Text style={styles.speed}>{Math.round(this.state.position.coords.speed * 2.23694)} MPH</Text>
                            <Text style={styles.speed}>{this.state.distanceTraveled.toFixed(1)} MILES</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    onRegionChange = (region) => {
        this.setState({region})
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
