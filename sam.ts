/*
** The SAM pattern is defined by this expression:
** V = S( vm( M.present( A(data) ) ), nap(M))
*/

////////////////////////////////////////////////////////////////////////////////
// Model 
//
interface Imodel {
    counter: number, 
	started: boolean,      
	launched: boolean, 
	aborted: boolean,
    state?: Istate,
    present?: (data) => void
}

const COUNTER_MAX = 10;

let model:Imodel = {

		counter: COUNTER_MAX, 
		started: false,      
	    launched: false, 
	    aborted: false
}

model.present = data => {
     
    if (state.counting(model)) {
        if (model.counter === 0) {
            model.launched = data.launched || false ;
        } else {
            model.aborted = data.aborted || false ;
            if (data.counter !== undefined) { model.counter = data.counter ; }
        }
    } else {
        if (state.ready(model)) {
            model.started = data.started || false ;
        }
    }
    state.render(model) ;
}


////////////////////////////////////////////////////////////////////////////////
// View
//
interface Iview {
    init: (model:Imodel) => string,
    ready: (model:Imodel) => string,
    counting: (model:Imodel) => string,
    aborted: (model:Imodel) => string,
    launched: (model:Imodel) => string,
    display: (representation:string) => void
}

const view:Iview = {
        
        // Initial State
    init : model => this.ready(model),

    // State representation of the ready state
    ready : model => {
        return (
                `<p>Counter: ${ model.counter }</p>
                <form onSubmit="JavaScript:return actions.start({});">
                    <input type="submit" value="Start">
                </form>`
         );

    },

    // State representation of the counting state
    counting : model => {
        return (
                `<p>Count down: ${ model.counter }</p>
                <form onSubmit="JavaScript:return actions.abort({});">
                    <input type="submit" value="Abort">
                </form>`
        );

    },

    // State representation of the aborted state
    aborted : model => {
        return (
                `<p>Aborted at Counter: ${ model.counter }</p>`
         );

    },

    // State representation of the launched state
    launched : model => {
        return (
                `<p>Launched</p>`
        );

    },

    //display the state representation
    display : representation => {
        const stateRepresentation = document.getElementById("representation");
        stateRepresentation.innerHTML = representation;
    }
};

// Display initial state
view.display(view.init(model));

////////////////////////////////////////////////////////////////////////////////
// State
//

type Ready = boolean;
type Counting = boolean;
type Launched = boolean;
type Aborted = boolean;

type StateMachine = Ready | Counting | Launched | Aborted;

interface Istate {
    view : Iview,
    ready: (model:Imodel) => boolean,
    counting: (model:Imodel) => boolean,
    launched: (model) => boolean,
    aborted: (model) => boolean,
    representation?: (model:Imodel) => void,
    nextAction?: (model:Imodel) => void,
    render?: (model:Imodel) => void
}

const state:Istate =  {
    
    view : view,

    ready : model => (model.counter === COUNTER_MAX) && !model.started && !model.launched && !model.aborted,

    counting : model => ((model.counter <= COUNTER_MAX) && (model.counter >= 0) && model.started && !model.launched && !model.aborted),

    launched : model => (model.counter == 0) && model.started && model.launched && !model.aborted,

    aborted : model => (model.counter <= COUNTER_MAX) && (model.counter >= 0) && model.started && !model.launched && model.aborted,

};

// Derive the state representation as a function of the systen
// control state

// Derive the current state of the system
state.representation = model => {
    
    let representation = 'oops... something went wrong, the system is in an invalid state' ;

    if (state.ready(model)) {
        representation = state.view.ready(model);
    }

    if (state.counting(model)) {
        representation = state.view.counting(model);
    }

    if (state.launched(model)) {
        representation = state.view.launched(model);
    }

    if (state.aborted(model)) {
        representation = state.view.aborted(model);
    }

    state.view.display(representation);
};

// Next action predicate, derives whether
// the system is in a (control) state where
// an action needs to be invoked

state.nextAction = model => {
    
    if (state.counting(model)) {
        if (model.counter > 0) {
            actions.decrement({ counter: model.counter }, model.present) ;
        }

        if (model.counter === 0) {
            actions.launch({}, model.present) ;
        }
    }
}

state.render = model => {
    
    state.representation(model);
    state.nextAction(model);
}

model.state = state ;


////////////////////////////////////////////////////////////////////////////////
// Actions
//

interface Iactions {
    start?: (data, present) => boolean,
    decrement?: (data, present) => void,
    launch?: (data, present) => void,
    abort?: (data, present) => boolean
}

var actions:Iactions = {} ;

actions.start = (data, present = model.present) => {
 
	data.started = true;
	present(data);
	return false;
}

actions.decrement = (data = {}, present = model.present) => {

	data.counter = data.counter || 10;
	const d = data;
	const p = present;
	setTimeout(function() {
		d.counter = d.counter - 1 ;
		p(d);
	}, 1000);
}

actions.launch = (data, present = model.present) => {

	data.launched = true ;
	present(data) ;
}

actions.abort = (data, present = model.present) => {

	data.aborted = true;
	present(data);
	return false;
}
