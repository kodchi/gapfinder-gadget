/**
 * The current version only supports category based section
 * recommendations.
 */
(function(d, $, mw, ve) {
    var API_BASE_URL = 'http://gapfinder.wmflabs.org/en.wikipedia.org/v1/section/article/',
        // # of recommendations to show
        MAX_RECOMMENDATION_COUNT = 5,
        $recommendationsPlaceholder;

    // Must be the Main namespace
    if (mw.config.get('wgNamespaceNumber') !== 0) {
        return;
    }

    if (mw.config.get('wgAction') === 'edit') {
        showSectionRecommendations();
    } else if (ve) {
        ve.trackSubscribe('mwedit.loaded', showSectionRecommendations);
        ve.trackSubscribe('mwedit.abort', hideSectionRecommendations);
    }

    /**
     * Fetch and show missing section recommendations before the edit area.
     */
    function showSectionRecommendations() {
        var title = mw.config.get('wgPageName');

        $.when(getSectionRecommendations(title),
               getSections(title))
            .then(getMissingSections)
            .then(showTopMissingSections);
    }

    /**
     * Remove section recommendations from the page
     */
    function hideSectionRecommendations() {
        $recommendationsPlaceholder.remove();
    }

    /**
     * Show top missing sections
     * @param {Array<Array<string, number>>} sections Array of section
     * names and their relevance scores
     */
    function showTopMissingSections(sections) {
        var $recommendationsPlaceholder =  $('<div id="gapfinder" class="mw-body">'),
            topSections = sections.slice(0, MAX_RECOMMENDATION_COUNT);

        $('<p>Here are the most relevant sections that are missing from the article you are editing. Feel free to create them.</p>')
            .appendTo($recommendationsPlaceholder);

        $('<ol></ol>').append(
            $.map(topSections, function (section) {
                return '<li>' + getNormalizedText(section[0]) + '</li>';
            })
        ).appendTo($recommendationsPlaceholder);

        $recommendationsPlaceholder.insertBefore('#content');
    }


    /**
     * Get missing sections
     * @param {Object} sectionRecommendations
     * @param {string[]} acrticleSections
     * @return {Array<Array<string, number>>} missing sections
     */
    function getMissingSections (sectionRecommendations, articleSections) {
        var result = [];
        $.each(sectionRecommendations, function(i, section) {
            if ($.inArray(section[0], articleSections) === -1) {
                result.push(section);
            }
        });
        result.sort(function(a, b) {
            return b[1] - a[1];
        });

        return result;
    }

    /**
     * Return normalized title for text
     * Useful for normalizing categories and sections.
     * @param {string} text
     * @return {string} normalized text
     */
    function getNormalizedTitle(text) {
        return mw.Title.newFromText(text).title;
    }

    /**
     * Return normalized text for title
     * @param {string} title
     * @return {string} normalized text
     */
    function getNormalizedText(title) {
        return mw.Title.newFromText(title).getMainText();
    }

    /**
     * Get sections for title
     * @param {string} title article title
     * @return {jQuery.Promise}
     * @return {Function} return.done
     * @return {string[]|false} return.done.data normalized section
     * names or false
     */
    function getSections(title) {
        return new mw.Api()
            .get({
                action: 'parse',
                page: getNormalizedTitle(title),
                prop: 'sections'
            })
            .then(function(data) {
                if (data && data.parse && data.parse.sections) {
                    return $.map(data.parse.sections, function(section) {
                        return section.line;
                    });
                }
                return false;
            });
    }

    /**
     * Get section recommendations for article
     * @param {string[]} categories
     * @return {jQuery.Promise}
     * @return {Function} return.done
     * @return {Object|false} return.done.data normalized section
     * names and their relevance scores as key value pairs or false
     */
    function getSectionRecommendations(title) {
        return $.getJSON(API_BASE_URL + title).then(function(response) {
            return response;
        });
    }

}(document, window.jQuery, window.mediaWiki, window.ve));
