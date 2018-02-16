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
        var title = mw.config.get('wgPageName'),
            $recommendationsPlaceholder =  $('<div id="' + recommendationPlaceholderId + '">'),
            anchorHeight = $(anchor).height() + 'px';

        $.getJSON(API_BASE_URL + title)
            .then(function(sections) {
                if (!sections.length) {
                    return;
                }

                let topSections = sections.slice(0, MAX_RECOMMENDATION_COUNT);

                $('<b>Sections you can add</b>')
                    .appendTo($recommendationsPlaceholder);

                // TODO: only show if more than 0 top sections
                $('<ol></ol>').append(
                    $.map(topSections, function (section) {
                        return '<li>' + section[0] + '</li>';
                    })
                ).appendTo($recommendationsPlaceholder);

                $recommendationsPlaceholder
                // TODO: do this in CSS
                    .css('height', anchorHeight)
                    .insertAfter(anchor);
            });
    }

    /**
     * Remove section recommendations from the page
     */
    function hideSectionRecommendations() {
        $('#' + recommendationPlaceholderId).remove();
    }
}(document, window.jQuery, window.mediaWiki, window.ve));
