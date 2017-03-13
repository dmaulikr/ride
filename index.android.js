/**
 * ANDROID STARTING POINT
 */
import App from 'app/index';
import { AppRegistry } from 'react-native';
import codePush from 'react-native-code-push';

AppRegistry.registerComponent('ride', () => codePush(App));
