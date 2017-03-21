import React, { Component } from 'react';
import { TouchableOpacity, Text } from 'react-native';

/**
 * Button Component
 */
export class Button extends Component {
    constructor(props) {
        super(props);

        this.buttonBox = {
            alignItems: "center",
            justifyContent: "center",
        };

        this.buttonText = {
            fontSize: 18,
            color: "white"
        }

        // Bordered
        if (props.bordered) {
            this.bordered = {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "white",
            }
        }

        // Full Width
        if (props.block) {
            this.block = {
                alignSelf: "stretch"
            }
        }
    }

    render() {
        return (
            <TouchableOpacity onPress={this.props.onPress} activeOpacity={.5} style={[this.buttonBox, this.bordered, this.block, this.props.style]}>
                <Text style={[this.buttonText, this.props.textStyle]}>
                    {this.props.children}
                </Text>
            </TouchableOpacity>
        )
    }
}
