/*
** Copyright (c) 2013 Nicolas Huon (http://nicolashuon.appspot.com)
** Licensed under the MIT License (LICENSE.txt).
*/

(function($)
{
	$.fn.mon_autocomplete = function(options)
	{
		var settings = $.extend({},
		{
			source: '',									// Array for local data or a query string for remote request. The term {query} is replaced with the input text
			delay: 500,									// Delay before processing the input text
			highlight: true,							// Whether or not to highlight to matching terms in the result labels
			fadeIn: 200,								// Fade in duration for the menu
			fadeOut: 200,								// Fade out duration for the menu
			menu_class: 'mon-autocomplete',				// Class applied to the drop down list
			label_class: '{menu-class}-label',			// Class applied to the label element (used to fill the input)
			label_name: 'label',						// Property name of the label in the result Object
			category_name: 'type',						// Property name of the category in the result Object
			category_class: '{menu-class}-{category}',	// Class applied to a category item
			item_class: '{menu-class}-item'				// Class applied to a result item
		}, options);
		
		return this.each(function()
		{
			var input = $(this);
			var key_up_timer;
			var cache = {};
			var categories = {};
			var menu = $('<ul/>').addClass(settings.menu_class);
			var category_class = settings.category_class.replace("{menu-class}", settings.menu_class);
			var item_class = settings.item_class.replace("{menu-class}", settings.menu_class);
			var label_class = settings.label_class.replace("{menu-class}", settings.menu_class);

			function GetResultLabel(result)
			{
				return result.hasOwnProperty(settings.label_name) ? result[settings.label_name] : result;
			}

			function ProcessResults(results)
			{
				menu.empty();
				categories = {};

				var num_results = results.length;
				for (var i = 0; i < num_results; i++)
				{
					var result = results[i];
					var list = null;

					// Check if the result has the category feature
					if (result.hasOwnProperty(settings.category_name))
					{
						var category_name = result[settings.category_name];

						// If the category already exists, use the associated list
						if (category_name in categories)
						{
							list = categories[category_name];
						}
						// Or create a new one
						else
						{
							title = $('<h3/>').text(category_name);
							list = $('<ul/>');
							menu.append($('<li/>').addClass(category_class.replace('{category}', category_name))
													.append(title)
													.append(list));
							categories[category_name] = list;
						}
					}
					// No category, add the result to the main list
					else
					{
						list = menu;
					}

					// If a custom format function is provided, use it
					var content;
					if (settings.format)
					{
						content = settings.format(result, label_class);
					}
					// Or just use the label
					else
					{
						content = $("<span/>").addClass(label_class).text(GetResultLabel(result));
					}

					// Append to the list
					list_item = $("<li/>");
					list.append(list_item.addClass(item_class).append(content));

					// Highlight matching terms
					if (settings.highlight)
					{
						label = list_item.find('.' + label_class);
						query = input.val();
						label.html(label.text().toLowerCase().replace(query, '<strong>' + query + '</strong>'));
					}
				}

				// Insert the menu in the DOM if it hasn't been done
				if (!jQuery.contains(document.documentElement, menu[0]))
				{
					// Append the menu to the DOM, using a custom placement function if provided
					if (settings.menu_placement)
					{
						settings.menu_placement(menu);
					}
					// Or by defaut, next to the input element
					else
					{
						input.after(menu);
					}
				}

				OpenMenu();
			}

			function UpdateResults()
			{
				var query = input.val();

				// Reset the menu if the query string is empty
				if (query.length == 0)
				{
					menu.empty();
					CloseMenu();
					return;
				}

				// Use the results from the cache if it exists
				if (query in cache)
				{
					ProcessResults(cache[query]);
				}
				// Or get it from the server if requested
				else if (typeof settings.source == "string")
				{
					$.getJSON(settings.source.replace("{query}", query), function(data)
					{
						// Cache the results for this query
						cache[query] = data;

						ProcessResults(data);
					});					
				}
				// Or use local data
				else
				{
					var filtered_data = [];
					var num_data = settings.source.length;
					for (var i = 0; i < num_data; i++)
					{
						if (GetResultLabel(settings.source[i]).indexOf(query) != -1)
						{
							filtered_data.push(settings.source[i]);
						}
					}
					ProcessResults(filtered_data);
				}
			}

			function OpenMenu()
			{
				menu.fadeIn(settings.fadeIn);

				input.trigger('open');
			}

			function CloseMenu()
			{
				menu.fadeOut(settings.fadeOut);

				input.trigger('close');
			}

			input.keyup(function(event)
			{
				window.clearTimeout(key_up_timer);

				// Let some time before updating the results as requesting data from the server
				// after each keystroke would be a bit expensive
				key_up_timer = window.setTimeout(function()
				{
					UpdateResults();
				},
				settings.delay);
			});

			input.blur(function(event)
			{
				window.clearTimeout(key_up_timer);

				// Delay the hiding of the menu so any click on the menu has time to trigger
				setTimeout(function()
				{
					CloseMenu();
				}, 200);
			});

			input.focus(function(event)
			{
				OpenMenu();
			});
			
			// Click item event, default behavior puts the value in input element and hide the menu
			$(document).on('click', '.' + item_class, function()
			{
				var item = $(this);
				input.val(item.find('.' + label_class).text());

				CloseMenu();
			});
		});
	};
})(jQuery);
