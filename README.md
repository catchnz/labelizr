Labelizr
========

CSS friendly jQuery implementation of the float label pattern.

The basic logic was inspired by https://github.com/clubdesign/floatlabels.js but this implementation takes a different approach.

## Usage

*HTML*

````html
<form>
    <input type="text" placeholder="I am an input"><br>
    <select data-label="I am a select">
        <option value="">I am a select</option>
        <option value="1">Value 1</option>
        <option value="2">Value 2</option>
    </select><br>
    <textarea placeholder="I am a textarea"></textarea><br>
    <label><input type="checkbox"> Check me out</label><br>
    <input type="submit" value="Submit">
</form>
````

*JavaScript*

````javascript
$('input, select, textarea').labelizr();
````

## Options

````json
{
    transitionDuration: 0.1,
    transitionEasing: 'ease-in-out',
    labelClass: '',
    classSwitchOnly: false,
    alwaysDisplay: [], // select, textarea, input
    typeMatches: /text|password|email|number|search|url|tel/,
    css: {
        'field': {},
        'field-active': {},
        'field-focus': {},
        'label': {
            'position': 'absolute',
            'color': '#838780',
            'background-color': 'transparent',
            '-moz-opacity': '0',
            '-khtml-opacity': '0',
            '-webkit-opacity': '0',
            'opacity': '0'
        },
        'label-active': {
            'color': '#838780',
            '-moz-opacity': '1',
            '-khtml-opacity': '1',
            '-webkit-opacity': '1',
            'opacity': '1'
        },
        'label-focus': {
            'color': '#2996cc'
        }
    }
}
````
