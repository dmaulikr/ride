import { StyleSheet } from 'react-native';

let primary = '#444'

/**
 * Styling for App
 */
export const styles = StyleSheet.create({
    app: {
        flex: 1
    },
    version: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        fontSize: 10,
        color: 'black',
        backgroundColor: 'transparent'
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center'
    },

    flexRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    rowItem: {
        flex: 1
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
        backgroundColor: '#FFF',
        borderColor: primary,
    },

    groupName: {
        top: 5,
        marginLeft: 10,
        fontWeight: '500',
        backgroundColor: 'transparent',
    },
    stopText: {
        color: primary,
        fontSize: 12,
        fontWeight: '500'
    },
    stopButton: {
        width: 60,
        height: 22,
        padding: 0,
        borderWidth: 1,
        marginBottom: 0,
        borderRadius: 3,
        borderColor: primary,
    },
    locationButton: {
        alignSelf: 'flex-end',
        marginRight: 10,
        backgroundColor: 'transparent'
    },

    bottom: {
        flex: 1
    },

    button: {
        margin: 8,
        padding: 12,
        borderWidth: 1.5,
        borderRadius: 3,
        borderColor: primary,
        backgroundColor: 'rgba(255,255,255,.95)'
    },
    buttonText: {
        color: primary,
        fontSize: 19
    },

    details: {
        margin: 8,
        padding: 15,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: primary,
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
        color: primary,
        fontWeight: '500',
        textAlign: 'center',
        marginVertical: 4
    },
    dataItemUser: {
        flex: 1.25
    },
});
