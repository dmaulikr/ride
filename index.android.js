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

export default class ride extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // region: {
            //     latitude: 37.78825,
            //     longitude: -122.4324,
            //     latitudeDelta: 0.0922,
            //     longitudeDelta: 0.0421,
            // }
        }
    }

    componentDidMount() {
        this.watchID = navigator.geolocation.watchPosition((position) => {
            this.setState({position});
            console.log(position);
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
                        <Text style={styles.speed}>{Math.round(this.state.position.coords.speed * 2.23694)} MPH</Text>
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
        height: 100,
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
    user: {
        color: '#d35400',
        fontSize: 22,
        marginBottom: 10
    },
    speed: {
        color: '#d35400',
        fontSize: 16
    }
});

AppRegistry.registerComponent('ride', () => ride);
