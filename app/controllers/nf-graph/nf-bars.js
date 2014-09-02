import Ember from 'ember';

export default Ember.ObjectController.extend({
	poop: null,
	
	data: function() {
		var arr = [];
		var str = 'abcdefg';
		
		for(var i = 0, len = str.length; i < len; i++) {
			arr.push({
				x: str[i],
				y: (i+1) * 100,
				className: 'foo-bar-' + (i % 3)
			});
		}
		
		return arr;
	}.property()
});