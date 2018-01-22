// The current version only supports category based section recommendations.

// The script works only in the 'view' action. To see the
// recommendations in the 'edit' action, the article sections need to be
// fetched from RESTBase (see TODO below).

(function(d, $, mw) {
    var API_BASE_URL = 'http://gapfinder.wmflabs.org/en.wikipedia.org/v1/section/category/',
        MAX_RECOMMENDATION_COUNT = 5;  // # of recommendations to show

    // Must be the Main namespace
    if (!mw.config.get('wgIsArticle') ||
        mw.config.get('wgNamespaceNumber') !== 0) {
        return;
    }

    fetchSections(getCurrentArticleCategories(), showCategorySections);

    /**
     * Return normalized title for text
     * Useful for normalizing categories and sections.
     * @param {string} text
     * @returns {string} normalized text
     */
    function getNormalizedTitle(text) {
        return mw.Title.newFromText(text).title;
    }

    /**
     * Fetch sections of the current article
     * @return {Set} normalized article sections
     *
     * TODO: Get this from restbase:
     * https://en.wikipedia.org/api/rest_v1/#!/Mobile/get_page_mobile_sections_title_revision
     */
    function getCurrentArticleSections() {
        var headlines = $('.mw-headline');

        return new Set($.map(headlines, function(headline) {
            return getNormalizedTitle($(headline).text());
        }));
    }

    /**
     * Get current article categories
     * @return {Array.string} Array of normalized category names
     */
    function getCurrentArticleCategories() {
        return $.map(mw.config.get('wgCategories'), function(category) {
            return getNormalizedTitle(category);
        });
    }

    /**
     * Fetch sections of category and call callback with data
     * @param {Array.string} categories Category names that are missing
     * from the current article
     */
    function fetchSections(categories, callback) {
        var currentArticleSections = getCurrentArticleSections(),
            sections = {},
            sectionsArray = [],
            // TODO: make the service accept multiple categories
            requests = $.map(categories, function(category) {
                return $.getJSON(API_BASE_URL + category);
            });

        $.when.apply($, requests).then(function() {
            Array.from(arguments).forEach(function(response) {
                response[0].forEach(function(apiSection) {
                    var section = getNormalizedTitle(apiSection[0]);
                    // Only consider sections that are missing from the
                    // current article.
                    if (currentArticleSections.has(section)) {
                        return;
                    }
                    if (section in sections) {
                        sections[section] =+ apiSection[1];
                    } else {
                        sections[section] = apiSection[1];
                    }
                });
            });

            $.each(sections, function(name, score) {
                sectionsArray.push([name, score]);
            });

            sectionsArray.sort(function(a, b) {
                return b[1] - a[1];
            });

            callback(sectionsArray.slice(0, MAX_RECOMMENDATION_COUNT));
        });
    }

    /**
     * Show category sections
     * @param {Array.Array<string, number>} sections Array of section
     * names and their relevance scores
     */
    function showCategorySections(sections) {
        // TODO: generate code color green to red using the relevance
        // scores and use that color as the section background color.
        $('<ul></ul>').append(
            $.map(sections, function (section) {
                return '<li>' + section[0] + '</li>';
            })
        ).insertAfter('#firstHeading');
    }
}(document, jQuery, mediaWiki));
