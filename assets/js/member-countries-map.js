/**
 * Member Countries Map - Interactive SVG Map
 */
(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var dataEl = document.getElementById('mcm-member-countries-data');
		if (!dataEl) return;

		var mapData;
		try {
			mapData = JSON.parse(dataEl.getAttribute('data-map'));
		} catch (e) {
			console.error('MCM: Failed to parse map data', e);
			return;
		}

		var activeCountries = mapData.activeCountries || [];
		var membersByCountry = mapData.membersByCountry || {};
		var countryNames = mapData.countryNames || {};

		var mapContainer = document.getElementById('mcm-members-map');
		if (!mapContainer) return;

		// Country code to SVG ID suffix mapping
		// The SVG uses IDs like "jqvmap1_xx" where xx is lowercase country code
		var countryCodeToSvgSuffix = {
			'AD': 'ad', 'AL': 'al', 'AM': 'am', 'AT': 'at', 'AZ': 'az',
			'BA': 'ba', 'BE': 'be', 'BG': 'bg', 'BY': 'by', 'CH': 'ch',
			'CY': 'cy', 'CZ': 'cz', 'DE': 'de', 'DK': 'dk', 'DZ': 'dz',
			'EE': 'ee', 'ES': 'es', 'FI': 'fi', 'FR': 'fr', 'GB': 'gb',
			'GE': 'ge', 'GL': 'gl', 'GR': 'gr', 'HR': 'hr', 'HU': 'hu',
			'IE': 'ie', 'IL': 'il', 'IQ': 'iq', 'IR': 'ir', 'IS': 'is',
			'IT': 'it', 'JO': 'jo', 'KS': 'ks', 'KZ': 'kz', 'LB': 'lb',
			'LI': 'li', 'LT': 'lt', 'LU': 'lu', 'LV': 'lv', 'MA': 'ma',
			'MC': 'mc', 'MD': 'md', 'ME': 'me', 'MK': 'mk', 'MT': 'mt',
			'NL': 'nl', 'NO': 'no', 'PL': 'pl', 'PT': 'pt', 'RO': 'ro',
			'RS': 'rs', 'RU': 'ru', 'SA': 'sa', 'SE': 'se', 'SI': 'si',
			'SK': 'sk', 'SM': 'sm', 'SY': 'sy', 'TM': 'tm', 'TN': 'tn',
			'TR': 'tr', 'UA': 'ua'
		};

		// Create tooltip
		var tooltip = document.createElement('div');
		tooltip.className = 'mcm-map-tooltip';
		mapContainer.appendChild(tooltip);

		// Highlight active countries on the SVG
		activeCountries.forEach(function (code) {
			var suffix = countryCodeToSvgSuffix[code];
			if (!suffix) return;

			// Find all paths that belong to this country (the SVG may have multiple paths per country)
			var svgEl = mapContainer.querySelector('svg');
			if (!svgEl) return;

			var paths = svgEl.querySelectorAll('[id$="_' + suffix + '"]');
			paths.forEach(function (path) {
				path.classList.add('mcm-active');
				path.setAttribute('data-country', code);
			});
		});

		// Also mark all child paths within a country group as active
		// Some country paths share the same parent ID
		var allRegions = mapContainer.querySelectorAll('.jqvmap-region');

		// Hover events for tooltip
		allRegions.forEach(function (region) {
			var code = region.getAttribute('data-country');

			region.addEventListener('mouseenter', function (e) {
				if (!code) return;
				var name = countryNames[code] || code;
				var members = membersByCountry[code];
				var html = '<span class="mcm-tooltip-country">' + name + '</span>';

				if (members && members.length) {
					html += '<br><span class="mcm-tooltip-count">' + members.length + ' member' + (members.length > 1 ? 's' : '') + '</span>';
				}

				tooltip.innerHTML = html;
				tooltip.style.display = 'block';
			});

			region.addEventListener('mousemove', function (e) {
				var rect = mapContainer.getBoundingClientRect();
				var x = e.clientX - rect.left + 15;
				var y = e.clientY - rect.top - 10;

				// Keep tooltip within bounds
				if (x + tooltip.offsetWidth > rect.width) {
					x = e.clientX - rect.left - tooltip.offsetWidth - 10;
				}

				tooltip.style.left = x + 'px';
				tooltip.style.top = y + 'px';
			});

			region.addEventListener('mouseleave', function () {
				tooltip.style.display = 'none';
			});

			// Click to filter country list
			region.addEventListener('click', function () {
				if (!code) return;
				if (!membersByCountry[code]) return;

				// Remove previous map highlights
				document.querySelectorAll('.jqvmap-region.mcm-highlighted').forEach(function (el) {
					el.classList.remove('mcm-highlighted');
				});

				// Highlight clicked country on map
				var svgSuffix = countryCodeToSvgSuffix[code];
				if (svgSuffix) {
					var svgEl = mapContainer.querySelector('svg');
					if (svgEl) {
						svgEl.querySelectorAll('[id$="_' + svgSuffix + '"]').forEach(function (p) {
							p.classList.add('mcm-highlighted');
						});
					}
				}

				// Filter country list: hide all except clicked country
				var allCards = document.querySelectorAll('.mcm-member-country');
				allCards.forEach(function (card) {
					if (card.getAttribute('data-code') === code) {
						card.classList.remove('mcm-country-filtered');
						card.classList.add('mcm-country-highlight');
					} else {
						card.classList.add('mcm-country-filtered');
						card.classList.remove('mcm-country-highlight');
					}
				});

				// Show the "Show all countries" button
				var showAllBtn = document.getElementById('mcm-btn-show-all');
				if (showAllBtn) {
					showAllBtn.classList.remove('mcm-hidden');
				}

				// Scroll to the country card
				var countryCard = document.querySelector('.mcm-member-country[data-code="' + code + '"]');
				if (countryCard) {
					countryCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			});
		});

		// "Show all countries" button
		var showAllBtn = document.getElementById('mcm-btn-show-all');
		if (showAllBtn) {
			showAllBtn.addEventListener('click', function (e) {
				e.preventDefault();

				// Remove all filters and highlights
				document.querySelectorAll('.mcm-member-country').forEach(function (card) {
					card.classList.remove('mcm-country-filtered');
					card.classList.remove('mcm-country-highlight');
				});

				document.querySelectorAll('.jqvmap-region.mcm-highlighted').forEach(function (el) {
					el.classList.remove('mcm-highlighted');
				});

				// Hide the button
				showAllBtn.classList.add('mcm-hidden');
			});
		}

		// Zoom functionality
		var zoomInBtn = document.querySelector('.jqvmap-zoomin');
		var zoomOutBtn = document.querySelector('.jqvmap-zoomout');
		var svgEl = mapContainer.querySelector('svg');
		var gEl = svgEl ? svgEl.querySelector('g') : null;

		if (zoomInBtn && zoomOutBtn && gEl) {
			var currentScale = 1.3352563711313101;
			var currentTranslateX = 0.7585313481757964;
			var currentTranslateY = 0;

			function updateTransform() {
				gEl.setAttribute('transform', 'scale(' + currentScale + ') translate(' + currentTranslateX + ', ' + currentTranslateY + ')');
			}

			zoomInBtn.addEventListener('click', function() {
				currentScale *= 1.2;
				currentTranslateX *= 1.2;
				currentTranslateY *= 1.2;
				updateTransform();
			});

			zoomOutBtn.addEventListener('click', function() {
				currentScale /= 1.2;
				currentTranslateX /= 1.2;
				currentTranslateY /= 1.2;
				updateTransform();
			});
		}
	});
})();
