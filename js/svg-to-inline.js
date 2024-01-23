/**
 * @file Takes an external SVG and converts it to an inline SVG
 * @author Domenic Polsoni
 * @version 0.1
*/

'use strict';

const SVGToInline = (function ()
{
	/**
	 * Adjust the existing featured merchant SVG for proper output.
	 * 
	 * @function processFeaturedMerchantsImages
	 * @param {Object} svgInline - The inline SVG image
	 */
	function processFeaturedMerchantsImages(svgInline)
	{
		// Optimize inline SVG
		optimizeInlineSVG(svgInline);

		// Remove SVG whitespace
		removeSVGWhiteSpace(svgInline);

		// Add unique identifiers to append to the classes to avoid internal stylesheet conflicts
		svgPrependClassIdentifiers(svgInline);

		// SAFARI HACK. Force a redraw in order to display SVG correctly.
		safariHack(svgInline);
	}


	/**
	 * Prepends unique identifier to inline SVG internal styles to prevent conflict with other inline SVG's that may share
	 * the same class names.
	 * 
	 * @function svgPrependClassIdentifiers
	 * @param {Object} svgInline - The inline SVG (DOM accessible)
	 */
	function svgPrependClassIdentifiers(svgInline)
	{
		let pageStyleSheets = document.styleSheets,
			uid = `uid-${Date.now()}`;

		// Remove any numbers from the beginning of the UID. Class names cannot start with numbers
		uid = uid.replace(/^[0-9]+/, '');

		// Compile collection of stylesheets (SAFARI doesn't recognize .sheets)
		Array.from(pageStyleSheets).forEach( thisSheet =>
		{
			let styleNode = thisSheet.ownerNode;

			// We only want this SVG's css
			if (svgInline === styleNode.parentNode)
			{
				let svgStyleRules = thisSheet.cssRules;

				styleNode.innerHTML = '';

				// Traverse the list of css rules and respective elements prepending the UID to each
				for (let i = 0, j = svgStyleRules.length; i < j; i++)
				{
					let oldElementClass = svgStyleRules[i].selectorText.substring(1),
						newElementClass = `${uid}-${oldElementClass}`,
						elements = svgInline.getElementsByClassName(oldElementClass);

					// Traverse styles within this class and alter rules
					for (let m = 0, n = svgStyleRules[i].style.length; m < n; m++)
					{
						let styleType = svgStyleRules[i].style[m],
							styleRule = svgStyleRules[i].style[styleType];

						styleNode.innerHTML += `.${newElementClass}{${styleType}: ${styleRule};}\n`;
					}

					// Alter the class on the element
					for (let m = elements.length - 1; m >= 0; m--)
					{
						if (!!elements[m])
						{
							elements[m].classList.replace(oldElementClass, newElementClass);
						}
					}
				}
			}
		});
	}

	/**
	 * Removes whitespace from inline SVG
	 * 
	 * @function removeSVGWhiteSpace
	 * @param {Object} svgInline - The inline svg
	 */
	function removeSVGWhiteSpace(svgInline)
	{
		let bbox = svgInline.getBBox(),
			viewBox = [bbox.x, bbox.y, bbox.width, bbox.height].join(' ');

		svgInline.setAttribute('viewBox', viewBox);
	}

	/**
	 * Set the viewport.
	 * 
	 * @param {Object} svg - the SVG whose viewport is being set 
	 */
	function setViewport(svg)
	{
		// Check if the viewport is set, if the viewport is not set the SVG wont't scale.
		if (!svg.getAttribute('viewBox') && svg.getAttribute('height') && svg.getAttribute('width'))
		{
			svg.setAttribute('viewBox', '0 0 ' + svg.getAttribute('height') + ' ' + svg.getAttribute('width'));
		}
	}

	/**
	 * Optimize inline SVG by removing unnecessary attributes 
	 * 
	 * @function optimizeInlineSVG
	 * @param {Object} svgInline - The inline SVG being optimized
	 * @returns {Object} The inline svg 
	 */
	function optimizeInlineSVG(svgInline)
	{
		let imgID = svgInline.id,
			imgClass = svgInline.className;

		// Add replaced image's ID to the new SVG
		if (typeof imgID !== 'undefined')
		{
			svgInline.setAttribute('id', imgID);
		}
		// Add replaced image's classes to the new SVG
		if (typeof imgClass !== 'undefined')
		{
			svgInline.classList.add('replaced-svg');
		}

		// Add style to output image correctly
		svgInline.classList.add('img-fluid');

		// Remove any invalid XML tags as per http://validator.w3.org
		svgInline.removeAttribute('xmlns:a');

		// Set viewport
		setViewport(svgInline);

		return svgInline;
	}

	/**
	 * Convert SVG image to inline SVG
	 * 
	 * @function convertSVGtoInline
	 * @param {Object} svgSource - The SVG image source
	 */
	function convertSVGtoInline(svgSource)
	{
		let imgURL = svgSource.dataset.svgSrc || svgSource.src; // src set through data attribute or src

		fetch(imgURL)
			.then(function (response)
			{
				return response.text();
			})
			.then(function (text)
			{
				let parser = new DOMParser(),
					xmlDoc = parser.parseFromString(text, 'image/svg+xml');

				// Get the SVG tag, ignore the rest
				let svgInline = xmlDoc.getElementsByTagName('svg')[0];

				svgInline = optimizeInlineSVG(svgInline);

				// Replace image with new SVG
				svgSource.parentNode.replaceChild(svgInline, svgSource);

				// Process and output the inline SVG
				processFeaturedMerchantsImages(svgInline);
			});
	}

	/**
	 * SAFARI HACK. Force a redraw in order to display SVG's correctly.
	 * 
	 * @function safariHack
	 * @param {Object} svgInline - The SVG
	 */
	function safariHack(svgInline)
	{
		svgInline.style.display = 'none';
		svgInline.offsetHeight;
		svgInline.style.display = 'flex';
	}


	return {
		convertSVGtoInline: convertSVGtoInline
	};
}());