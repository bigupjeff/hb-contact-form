/**
 * Herringbone Contact Form Client Controller.
 *
 * Control client form submission performed with fetch and the
 * WP REST api. All data transmitted in JSON for adabtability.
 * 
 * @package Herringbone
 * @subpackage HB_Contact_Form
 * @author Jefferson Real <me@jeffersonreal.com>
 * @copyright Copyright (c) 2021, Jefferson Real
 * @license GPL2+
 * 
 */
(function form_sender() {
'use strict';


    let debug = true;

    /**
     * Grab WP localize vars.
     * 
     * wp_localize_hb_contact_form_vars.*
     * .rest_url;
     * .rest_nonce;
     * .admin_email;
     * 
     */
    const wp = wp_localize_hb_contact_form_vars;


    /**
     * Prepare the form ready for input.
     * 
     */
    function form_init() {

        // Hide the honeypot input field(s)
        let honeypot = document.querySelectorAll( '.jsSaveTheBees' );
        honeypot.forEach( input => { input.style.display = "none" } );

        // Attach submit listener callback to the form(s)
        document.querySelectorAll( '.jsFormSubmit' ).forEach( form => {
            form.addEventListener( 'submit', handle_form_submit );
        } );
    };

    let start; //holds the start time of the request for debugging.

    /**
     * Handle the submitted form.
     * 
     * Process:
     *      fetch    initiate http request using fetch api.
     *      .then    parse json to js object.
     *      .then    process response to user output.
     *      .catch   process errors that came down chain.
     * 
     * @param {SubmitEvent} event
     * 
     */
    async function handle_form_submit( event ) {

        // prevent normal submit action
        event.preventDefault();

        start = Date.now();
        if(debug) console.log( stopwatch() + ' |#####| FUNCTION START');

        // get the element the event handler was attached to.
        const form = event.currentTarget;

        // if honeypot has a value ( bye bye bot )
        if ( '' != form.querySelector( '[name="required_field"]' ).value ) {
            document.documentElement.remove();
            window.location.replace( "https://en.wikipedia.org/wiki/Robot" );
        }

        // Get elements of submitted form.
        const button = form.querySelector( '.jsButtonSubmit' );
        const button_label = form.querySelector( '.jsButtonSubmit > *:first-child' );
        const output = form.querySelector( '.HB__form_output' );

        let classes = [ 'HB__form-popout', 'alert' ];
        const pending_text = "Connecting...";

        // Grab `FormData` then convert to plain obj, then to json string.
        const form_data = new FormData( form );
        const plain_obj_data = Object.fromEntries( form_data.entries() );
        const json_string_data = JSON.stringify( plain_obj_data );

        // Fetch params.
        const url = wp.rest_url;
        const fetch_options = {
            method: "POST",
            headers: {
                "X-WP-Nonce"    : wp.rest_nonce,
                "Content-Type"  : "application/json",
                "Accept"        : "application/json"
            },
            body: json_string_data,
        };


        /**
         * Async form submission timeline
         * 
         * For debugging, set 'debug = true' (see start of form_sender()).
         * 
         */
        try {
            output.style.display = 'flex';
            let button_idle_text = toggle_button( button, button_label, '[busy]' );
            let popouts_pending = await popouts_into_dom( output, [ pending_text ], classes );

/*
            let [ ,,result ] = await Promise.all( [
                node_transition( output, 'opacity', '1' ),
                transition( popouts_pending, 'opacity', '1' ),
                fetch_http_request( url, fetch_options )
            ] );
*/

            let out1 = await transition( output, 'opacity', '1' );
console.log( 'out1' );
console.log( out1 );
            let out2 = await transition( popouts_pending, 'opacity', '1' );
console.log( 'out2' );
console.log( out2 );
            let result = await fetch_http_request( url, fetch_options );
console.log( 'result' );
console.log( result );

            result.class = ( result.ok ) ? 'success' : 'danger';
            classes = [ ...classes, 'alert-' + result.class ];


            let out3 = await transition( popouts_pending, 'opacity', '0' );
console.log( 'out3' );
console.log( out3 );

await pause( 5000 );

            let out4 = await remove_children( output );
console.log( 'out4' );
console.log( out4 );

await pause( 5000 );

            let popouts_complete = await popouts_into_dom( output, result.output, classes );
console.log( 'popouts_complete' );
console.log( popouts_complete );

await pause( 5000 );

            let out5 = await transition( popouts_complete, 'opacity', '1' );
console.log( 'out5' );
console.log( out5 );
            let out6 = await pause( 5000 );
console.log( 'out6' );
console.log( out6 );
            let out7 = await transition( popouts_complete, 'opacity', '0' );
console.log( 'out7' );
console.log( out7 );
            let out8 = await transition( output, 'opacity', '0' );
console.log( 'out8' );
console.log( out8 );
            let out9 = await remove_children( output );
console.log( 'out9' );
console.log( out9 );

            output.style.display = 'none';
            toggle_button( button, button_label, button_idle_text );

        } catch ( error ) {
            console.error( error );
        } finally {
            if(debug) console.log( stopwatch() + ' |#####| FUNCTION END');
        }

    };

    /**
     * Log timestamps in debug mode.
     * @returns milliseconds since function call.
     */
    function stopwatch() {
        let elapsed = Date.now() - start;
        return elapsed.toString().padStart(4, '0');
    }


    /**
     * Perform a Fetch request with timeout and json response.
     * 
     * Timeouts:
     *     6s for webserver to SMTP server.
     *     8s for SMTP send response to webserver.
     *     14s for front end as fallback in lieu of server response.
     * 
     * controller - abort controller to abort fetch request.
     * abort - abort wrapped in a timer.
     * signal: controller.signal - attach timeout to fetch request.
     * clearTimeout( timeoutId ) - cancel the timer on response.
     * 
     * @param {string} url      The WP plugin REST endpoint url.
     * @param {object} options  An object of fetch API options.
     * @return {object}         An object of message strings and ok flag.
     * 
     */
    async function fetch_http_request( url, options ) {
        if(debug) console.log( `${stopwatch()} |START| Fetch request` );
        const controller = new AbortController();
        const abort = setTimeout( () => controller.abort(), 14000 );
        try {
            const response = await fetch( url, {
                ...options,
                signal: controller.signal
            } );
            clearTimeout( abort );
            // parse response body as JSON.
            const result = await response.json();
            result.ok = response.ok;
            if ( typeof result.output === 'string' ) result.output = [ result.output ];
            if ( ! result.ok ) throw result;
            return Promise.resolve ( result );
        } catch ( error ) {
            if ( ! error.output ) {
                // error is not a server response.
                error.output = [ 'Failed to establish a connection to the server.' ];
                error.ok = false;
            }
            for ( const message in error.output ) {
                console.error( make_human_readable( error.output[ message ] ) );
            }
            //Don't reject as having an error to handle is a success to caller.
            return Promise.resolve ( error );
        } finally {
            if(debug) console.log( `${stopwatch()} | END | Fetch request` );
        }
    }


    /**
     * Clean strings for human output.
     * 
     * This function uses regex patterns to clean strings in 3 stages:
     * 
     * 1) Remove all html tags not inside brackets ()
     *      (?<!\([^)]*?) - do not match if preceeded by a '('
     *      <[^>]*?> - match all <>
     * 2) Remove anything that is not:
     *      (\([^\)]*?\)) - content enclosed in ()
     *      ' '   - spaces
     *      \p{L} - letters
     *      \p{N} - numbers
     *      \p{M} - marks (accents etc)
     *      \p{P} - punctuation
     * 3) Trim and replace multiple spaces with a single space.
     * 
     * @link https://www.regular-expressions.info/unicode.html#category
     * @param {string} string The dirty string.
     * @returns The cleaned string.
     * 
     */
    function make_human_readable( string ) {
        const tags = /(?<!\([^)]*?)<[^>]*?>/g;
        const human_readable = /(\([^\)]*?\))|[ \p{L}\p{N}\p{M}\p{P}]/ug;
        const bad_whitespaces = /^\s*|\s(?=\s)|\s*$/g;
        let notags = string.replace( tags, '' );
        let notags_human = notags.match( human_readable ).join('');
        let notags_human_clean = notags_human.replace( bad_whitespaces, '' );
        return notags_human_clean;
    }


    /**
     * Remove all child nodes from a dom node.
     * 
     * @param {object} parent The dom node to remove all child nodes from.
     * 
     */
    function remove_children( parent ) {
        if(debug) console.log( `${stopwatch()} |START| remove_children | ${parent.classList}` );
        return new Promise( ( resolve ) => {
            try {
                while ( parent.firstChild ) {
                    parent.removeChild( parent.firstChild );
                }
                resolve( 'All child nodes removed successfully.' );
            } catch ( error ) {
                reject( error );
            } finally {
                if(debug) console.log( `${stopwatch()} | END | remove_children | ${parent.classList}` );
            }
        } );
    }


    /**
     * Helper function to async pause.
     * 
     * @param {integer} milliseconds Duration to pause.
     * 
     */
    function pause( milliseconds ) { 
        return new Promise( ( resolve ) => { 
            setTimeout( () => {
                resolve( 'Pause completed successfully.' );
            }, milliseconds )
        } );
    }


    /**
     * Toggle a button between two states and return the old label.
     * 
     * @param {object} button The button element.
     * @param {object} button_label The button label element.
     * @param {string} text The text to set the button to.
     * 
     */
    function toggle_button( button, button_label, text ) {
        if ( button_label.innerText === text ) return text;
        let old_text = button_label.innerText;
        button.disabled = ( button.disabled === true ) ? false : true;
        button_label.innerText = text;
        return old_text;
    }


    /**
     * Create an array of popout message elements and insert into dom.
     * 
     * @param {object} parent_element The parent node to append to.
     * @param {array}  message_array An array of messages as strings.
     * @param {array}  classes An array of classes.
     * 
     */
    function popouts_into_dom( parent_element, message_array, class_array ) {
        if(debug) console.log( `${stopwatch()} |START| popouts_into_dom | ${message_array[0]}` );
        return new Promise( ( resolve, reject ) => {
            try {
                if ( ! parent_element || parent_element.nodeType !== Node.ELEMENT_NODE ) {
                    throw new TypeError( `parent_element must be an element node.` );
                } else if ( ! is_iterable( message_array ) ) {
                    throw new TypeError( `message_array must be non-string iterable. ${typeof message_array} found.` );
                }
                let popouts = [];
                message_array.forEach( ( message ) => {
                    let p = document.createElement( 'p' );
                    p.innerText = make_human_readable( message );
                    class_array.forEach( ( class_name ) => {
                        p.classList.add( class_name );
                    } );
                    parent_element.appendChild( p );
                    popouts.push( p );
                } );
                resolve( popouts );
            } catch ( error ) {
                reject( error );
            } finally {
                console.log( `${stopwatch()} | END | popouts_into_dom | ${message_array[0]}` );
            }
        } );
    }



    /**
     * Transition a single element node with a callback on completion.
     *
     * No animation is performed here, this function expects a transition
     * duration to be set in CSS, otherwise the promise will not resolve as
     * no 'transitionend' event will be fired.
     * 
     * @param {object} node Element bound using bind() by caller.
     * @param {string} property The css property to transition.
     * @param {string} value The css value to transition to.
     * @return {Promise} A promise that resolves when the transition is complete.
     * 
     */
    function transition_to_resolve( property, value ) {

        return new Promise( ( resolve ) => {
            if(debug) console.log( `${stopwatch()} |START| transition | ${this.classList} : ${property} : ${value}` );
            this.style[ property ] = value;

            const resolve_and_cleanup = ( event ) => {

                if ( event.propertyName !== property ) throw new Error( 'Property name mismatch.' );
                if(debug) console.log( `${stopwatch()} | END | transition | ${this.classList} : ${property} : ${value}` );
                resolve( 'Transition complete.' );
                this.removeEventListener( 'transitionend', resolve_and_cleanup, { once: true } );
            };

            this.addEventListener( 'transitionend', resolve_and_cleanup, { once: true } );

        } );
    }


    /**
     * Transition node(s) in parallel with resolved promise on completion.
     * Accepts a single node or an array of nodes to provide a common interface
     * for all element transitions.
     * 
     * Expects a transition duration to be set in CSS.
     * 
     * @param {array}  elements An array of elements.
     * @param {string} property The css property to transition.
     * @param {string} value The css value to transition to.
     * @return {Promise} A promise that resolves when all transitions are complete.
     * 
     */
    async function transition( elements, property, value ) {

        if ( ! is_iterable( elements ) ) elements = [ elements ];
        if ( is_iterable( elements )
            && elements.every( ( element ) => { return element.nodeType === 1 } ) ) {

            //we have an array of nodes.
            const promises = elements.map( ( node ) => transition_to_resolve.bind( node )( property, value ) );
            const parent_promise = await Promise.all( promises );
            return parent_promise;

        } else {
            throw new TypeError( 'elements must be a non-string iterable. ' + typeof elements + ' found.');
        }
    }


    function is_iterable( object ) {
        // checks for null and undefined
        if ( object == null ) {
          return false;
        }
        return typeof object[Symbol.iterator] === 'function';
    }


    /**
     * Fire form_init() on 'doc ready'.
     * 
     */
    let interval = setInterval( function() {
        if ( document.readyState === 'complete' ) {
            clearInterval( interval );
            form_init();
        }
    }, 100);

})();
