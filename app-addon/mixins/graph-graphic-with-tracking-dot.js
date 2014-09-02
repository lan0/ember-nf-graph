import Ember from 'ember';
import { property } from '../utils/computed-property-helpers';
import GraphTrackingActionContext from '../utils/nf/graph-tracking-action-context';

/**
  Adds tracking dot functionality to a component such as {{#crossLink "components.nf-line"}}{{/crossLink}}
  or {{#crossLink "components.nf-area"}}{{/crossLink}}
  
  @namespace mixins
  @class graph-graphic-with-tracking-dot
  */
export default Ember.Mixin.create({
  /**
    Gets or sets the tracking mode of the component.

    Possible values are:

    - 'none': no tracking behavior
    - 'hover': only track while mouse hover
    - 'snap-last': track while mouse hover, but snap to the last data element when not hovering
    - 'snap-first': track while mouse hover, but snap to the first data element when not hovering
    - 'selected-hover': The same as `'hover'` tracking mode, but only when the compononent is 
    {{#crossLink "mixins.graph-selectable-graphic/selected:property"}}{{/crossLink}}
    - 'selected-snap-last': The same as `'snap-last'` tracking mode, but only when the compononent is 
    {{#crossLink "mixins.graph-selectable-graphic/selected:property"}}{{/crossLink}}
    - 'selected-snap-first': The same as `'snap-first'` tracking mode, but only when the compononent is 
    {{#crossLink "mixins.graph-selectable-graphic/selected:property"}}{{/crossLink}}

    @property trackingMode
    @type String
    @default 'none'
  */
  trackingMode: 'none',

  trackedData: null,

  trackingDotRadius: 2.5,

  isShouldTrack: Ember.computed.or('isSelectedHoverMode', 'isHoverMode'),

  isSelectedHoverMode: property('trackingMode', function(mode) {
    return mode === 'selected-hover' || mode === 'selected-snap-first' || mode === 'selected-snap-last';
  }),

  isHoverMode: property('trackingMode', function(mode) {
    return mode === 'hover' || mode === 'snap-first' || mode === 'snap-last';
  }),

  hoverData: null,

  isHovered: false,

  showTrackingDot: property('trackedData.x', 'trackedData.y', function(x, y) {
    return typeof x === 'number' && typeof y === 'number';
  }),

  _updateHovered: function() {
    if(this.get('isShouldTrack')) {
      this.set('trackedData', this.get('hoverData'));
    }
  }.observes('isShouldTrack', 'hoverData'),

  _processUpdateUnhovered: function(){
    if(!this.get('isHovered')) {
      var mode = this.get('trackingMode');
      var selected = this.get('selected');
      if(mode === 'snap-last' || (selected && mode === 'selected-snap-last')) {
        this.set('trackedData', this.get('lastVisibleData'));
      }
      if(mode === 'snap-first' || (selected && mode === 'selected-snap-first')) {
        this.set('trackedData', this.get('firstVisibleData'));
      }
    }
  },

  _updateUnhovered: function(){
    Ember.run.scheduleOnce('actions', this, this._processUpdateUnhovered);
  }.observes('isHovered', 'trackingMode', 'firstVisibleData', 'lastVisibleData', 'selected').on('didInsertElement'),

  /**
    The action name to send to the controller when the `hoverChange` event fires
    @property hoverChange
    @type String
    @default null
  */
  hoverChange: null,

  /**
    Event handler for content hoverChange event. Triggers `didHoverChange`.
    @method didContentHoverChange
    @params e {utils.nf.graph-mouse-action-context}
    @private
  */
  didContentHoverChange: function(e){
    var graph = this.get('graph');

    this.trigger('didHoverChange', GraphTrackingActionContext.create({
      mouseX: e.get('mouseX'),
      mouseY: e.get('mouseY'),
      source: this,
      graph: graph,
    }));
  },

  /**
    Event handler for didHoverChange. Sends hoverChange action.
    @method didHoverChange
    @param e {utils.nf.graph-tracking-action-context}
  */
  didHoverChange: function(e) {
    var isHoverMode = this.get('isHoverMode');
    var isSelectedHoverMode = this.get('isSelectedHoverMode');
    var selected = this.get('selected');

    if(!this.get('isHovered')) {
      this.set('isHovered', true);
    }

    if(isHoverMode || (selected && isSelectedHoverMode)) {
      this.set('hoverData', e);
    }

    if(this.get('hoverChange')) {
      this.sendAction('hoverChange', e);
    }
  },

  /**
    Name of the action to send on `hoverEnd`
    @property hoverEnd
    @type String
    @default null
  */
  hoverEnd: null,

  /**
    Event handler for didHoverEnd. Updates tracked data, and sends hoverEnd action.
    @function didHoverEnd
    @params e {Object} hover end event object.
  */
  didHoverEnd: function(e) {
    this.set('hoverData', null);

    if(this.get('isHovered')) {
      this.set('isHovered', false);
    }

    if(this.get('hoverEnd')) {
      this.sendAction('hoverEnd', {
        originalEvent: e,
        source: this,
        graph: this.get('graph'),
      });
    }
  },

  /**
    The action to send on `didTrack`.
    @property didTrack
    @type String
    @default null
  */
  didTrack: null,

  /**
    Observes changes to tracked data and sends the
    didTrack action.
    @method _sendDidTrack
    @private
  */
  _sendDidTrack: function(){
    if(this.get('didTrack')) {
      this.sendAction('didTrack', {
        x: this.get('trackedData.x'),
        y: this.get('trackedData.y'),
        data: this.get('trackedData.data'),
        source: this,
        graph: this.get('graph'),
      });
    }
  }.observes('trackedData'),

  /**
    The action to send on `willTrack`
    @property willTrack
    @type String
    @default null
  */
  willTrack: null,

  /**
    Observes impending changes to trackedData and sends
    the willTrack action.
    @method _sendWillTrack
    @private
  */
  _sendWillTrack: function(){
    if(this.get('willTrack')) {
      this.sendAction('willTrack', {
        x: this.get('trackedData.x'),
        y: this.get('trackedData.y'),
        data: this.get('trackedData.data'),
        source: this,
        graph: this.get('graph'),
      });
    }
  }.observesBefore('trackedData'),

  /**
    Handles the graph-content's hoverEnd event and triggers didHoverEnd
    @method didContentHoverEnd
    @param e {utils.nf.graph-mouse-action-context}
    @private
  */
  didContentHoverEnd: function(e){
    var graph = this.get('graph');

    this.trigger('didHoverEnd', {
      originalEvent: e,
      source: this,
      graph: graph,
    });
  },

  /**
    Sets up subscriptions to content hover events.
    @method _initializeTrackingDot
    @private
  */
  _initializeTrackingDot: function(){
    var content = this.get('graph.content');
    content.on('didHoverChange', this, this.didContentHoverChange);
    content.on('didHoverEnd', this, this.didContentHoverEnd);
  }.on('didInsertElement'),
});