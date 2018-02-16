/**
 * The current version only supports category based section
 * recommendations.
 */
(function(d, $, mw, ve) {
    var API_BASE_URL = 'http://gapfinder.wmflabs.org/en.wikipedia.org/v1/section/article/',
        // # of recommendations to show
        MAX_RECOMMENDATION_COUNT = 10,
        recommendationPlaceholderId = 'gapfinder',
        anchor;

    // Must be the Main namespace
    if (mw.config.get('wgNamespaceNumber') !== 0) {
        return;
    }

    if (mw.config.get('wgAction') === 'edit') {
        anchor = '.wikiEditor-ui';
        showSectionRecommendations();
    }

    if (ve) {
        ve.trackSubscribe('mwedit.loaded', onVELoaded);
    }

    function onVELoaded() {
        anchor = '.ve-init-mw-desktopArticleTarget-originalContent';
        showSectionRecommendations();
        ve.trackSubscribe('mwedit.abort', hideSectionRecommendations);
        ve.trackSubscribe('mwedit.saveSuccess', hideSectionRecommendations);
    }

    /**
     * Fetch and show missing section recommendations before the edit area.
     */
    function showSectionRecommendations() {
        var title = mw.config.get('wgPageName');

        getSectionRecommendations(title)
            .then(showTopMissingSections);
    }

    /**
     * Remove section recommendations from the page
     */
    function hideSectionRecommendations() {
        $('#' + recommendationPlaceholderId).remove();
    }

    /**
     * Show top missing sections
     * @param {Array<Array<string, number>>} sections Array of section
     * names and their relevance scores
     */
    function showTopMissingSections(sections) {
        var $recommendationsPlaceholder =  $('<div id="' + recommendationPlaceholderId + '">'),
            topSections = sections.slice(0, MAX_RECOMMENDATION_COUNT),
            anchorHeight = $(anchor).height() + 'px';

        $('<b>Sections you can add</b>')
            .appendTo($recommendationsPlaceholder);

        // TODO: only show if more than 0 top sections
        $('<ol></ol>').append(
            $.map(topSections, function (section) {
                return '<li>' + getNormalizedText(section[0]) + '</li>';
            })
        ).appendTo($recommendationsPlaceholder);

        $recommendationsPlaceholder
        // TODO: do this in CSS
            .css('height', anchorHeight)
            .insertAfter(anchor);
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
