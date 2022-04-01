const nodeUpdated = [];

function nodes(selector) {
    return Array.from(document.querySelectorAll(selector));
}

function updateNodes(settingName, selector, fn) {
    ifEnabled(settingName, () =>
        nodes(selector)
            .filter(e => !nodeUpdated.includes(e))
            .forEach((element, index, array) => {
                fn(element, index, array)
                nodeUpdated.push(element);
            })
    )
}

const cache = new Map();
function ifEnabled(settingName, fn) {
    if (cache.has(settingName)) {
        if (!cache.get(settingName)) {
            fn();
        }
    } else {
        chrome.storage.sync.get([settingName], function (result) {
            cache.set(settingName, result[settingName])
            if (!cache.get(settingName)) {
                fn();
            }
        })
    }
}


function createHtmlButton(innerHtml, classList, onClick) {
    const button = document.createElement('button');
    button.innerHTML = innerHtml;
    classList.forEach(className => {
        button.classList.add(className)
    })
    button.addEventListener('click', onClick);

    return button;
}
const filterVars = {};
const Mettl = {
    AJAX: function (opts) {
        var settings = { type: opts.method || 'POST', contentType: 'application/json; charset=utf-8;', cache: opts.cache,
            url: opts.url, data: JSON.stringify(opts.data || {}), dataType: opts.dataType || 'json', async: opts.async, global: opts.global,
            success: opts.success, error: function (jqXhr, textStatus, errorThrown) {
                if (jqXhr.status == 401 && errorThrown.toLowerCase() == 'unauthorized')
                    window.location.href = '/corporate/login?returnUrl='+ encodeURIComponent(window.location.pathname);
                else if (opts.error)
                    opts.error(jqXhr, textStatus, errorThrown);
            },
            beforeSend: opts.beforeSend,
            complete: opts.complete
        };
        if(opts.headers){
            settings.headers = opts.headers;
        }
        if(opts.crossDomain){
            settings.crossDomain = opts.crossDomain;
        }
        if(settings.type.toUpperCase() == 'GET' && settings.data == "{}"){
            delete settings.data;
        }
        $.ajax(settings);
    }
};

// template override for underscore template engine
_.templateSettings={interpolate:/\<\@\=(.+?)\@\>/gim,evaluate:/\<\@(.+?)\@\>/gim,escape:/\<\@\-(.+?)\@\>/gim};


// function renderQuestions(newQuestions, map, reviewedQuestionCount, skillNodeName, isAppend, b) {
//     const script = document.createElement('script');
//     script.innerHTML = `
//     renderQuestions(
//     ${JSON.stringify(newQuestions)},
//     ${JSON.stringify(map)},
//     ${JSON.stringify(reviewedQuestionCount)},
//     ${JSON.stringify(skillNodeName)},
//     ${JSON.stringify(isAppend)},
//     ${JSON.stringify(b)},
//     );
//     `;
//     document.body.append(script);
// }
function renderQuestions(questions, map, reviewedQuestionCount, skillNodeName, isAppend, isSearch) {

    var qa = $('#question-wrapper');
    if (isSearch)
        var searchVal = '<span class="search-msg">Search Result for </span>' + $('#search').val();

    map.EASY = map.EASY || 0;
    map.MEDIUM = map.MEDIUM || 0;
    map.DIFFICULT = map.DIFFICULT || 0;
    isAppend = isAppend || false;
    var isEmpty = !questions.length;
    var category = skillNodeName == "IndustrySkills" ? "All Questions" : skillNodeName;
    category = category || "All Questions";
    var isTotal = filterVars.difficulty == 'all' || filterVars.difficulty == null;
    var unReviewedQuestionCount = 0;
    if (isTotal) {
        unReviewedQuestionCount = map.EASY + map.MEDIUM + map.DIFFICULT - reviewedQuestionCount;
    }
    else {
        if (filterVars.difficulty == 1) {
            unReviewedQuestionCount = map.EASY - reviewedQuestionCount
        }
        else if (filterVars.difficulty == 2) {
            unReviewedQuestionCount = map.MEDIUM - reviewedQuestionCount
        }
        else {
            unReviewedQuestionCount = map.DIFFICULT - reviewedQuestionCount
        }
    }

    var data = {
        category: category,
        questionCount: map.EASY + map.MEDIUM + map.DIFFICULT,
        easyQuestionCount: map.EASY,
        mediumQuestionCount: map.MEDIUM,
        difficultQuestionCount: map.DIFFICULT,
        reviewedQuestionCount: reviewedQuestionCount,
        unReviewedQuestionCount: unReviewedQuestionCount,
        isEmpty: isEmpty,
        msg: isSearch ? 'No search results' : 'No questions here',
        isSearch: isSearch,
        searchMsg: searchVal,
        isTotal: isTotal,
        isEasy: filterVars.difficulty == 1,
        isMedium: filterVars.difficulty == 2,
        isDifficult: filterVars.difficulty == 3,
        questionReviewType: filterVars.questionReviewType
    };

    if(!isAppend){
        try{
            qa.html(_.template($('#question-list-template').html(), data));
        }catch(e){
            console.log(e.message);
        }
        if (isEmpty) {
            var $h = $('#menu-tree').height() + 30;
            $('.right-container').css('min-height', $h);
        }
    }

    var cb = qa.find('.content-body');

    $.each(questions, function(index){
        var hasError = false;
        var question;
        try{ //Print Question Text
            question = questions[index];
            cb.append(_.template($('#question-content-template').html(), {question: question, formatter: function(text) {
                    return textFormatter.format(text);
                }}));
        }catch(e){
            hasError = true;
            console.log(e.message);
        }

        var lastQ = cb.find('._question').last();
        try{ //Add question footer
            lastQ.append(_.template($('#bottom-block-template').html(), {question: question, hasError : hasError}));
            lastQ.append(_.template($('#flagging-template').html()));
        }catch(e){
            console.log(e.message);
        }
    });

    var page =  Mettl.FW;
    //page.Init(qa,userid,clientid);

    if (isEmpty) {
        var $h = $('#menu-tree').height() + 30;
        $('.right-container').css('min-height', $h);
    }

    if (isLastPage)
        $('#question-wrapper ._show-more').remove();
    else
        qa.append('<div class="_show-more showMore"><button type="button" class="btn btn-default">Show More</button></div>');

    $('#question-wrapper').off('click', '._show-more button').on('click', '._show-more button', function () {
        this.innerHTML = "Loading...";
        this.disabled = true;
        filterVars.fetchTree = false;
        getQuestionAndSkillSummary(currentSkill.Id, currentSkill.Name, true);
    });

    if (isSearch) {
        searchHilitor = new Hilitor("question-wrapper");
        searchHilitor.apply(filterVars.searchString);
    }

    var deleteButtons = $("#pane-top ._selection-area ._delete");

    //multiple delete
    /*handleDeletePopover(deleteButtons, function ($el) {
        var buttons = qa.find('._select._active');
        _.each(buttons, function (button, index) {
            var $btn = $(button);
            var parentQ = $btn.parents('._question');
            var qid = parseInt(parentQ.data('id'));
            deleteQuestion(buttons.length, qid, function () {
                $(this).remove();
                complete();
            });
        });

        function complete() {
            showDeletedAlert(buttons.length);
            selectionArea.hide();
            selectionArea.parent().find('._add-q-container').show();
        }
    });*/

    //single delete
//     handleDeletePopover(qa.find('._delete'), function ($el) {
//         var parent = $el.parents('._question');
//         var qId = parseInt(parent.data('id'));
//         deleteQuestion(1, qId, function () {
// //                parent.slideUp(500);
//             setTimeout(function () {
//                 parent.remove();
//             }, 500);
//             showDeletedAlert(1);
//         });
//     });

    var $mainQuestion = $('#question-wrapper').find('._question');
    for(var i=0; i < $mainQuestion.length; i++) {
        var $table = $($mainQuestion[i]).find('table');
        if($table.length > 0 && !$table.parent().hasClass('scrollable-table')) {
            $table.wrap('<div class="scrollable-table"></div>');
        }
    }
}


function getQuestionAndSkillSummary(tag) {
    const activeSkillNode = $('.activeSkillNode');
    const skillNodeId = activeSkillNode.data('id');
    const skillNodeName = activeSkillNode.parents('li').find('.name').text();
    const isAppend = false;
    const isEnforce = true;
    const toRefreshSkills = false;
    const sendGA = false;
    let isAjaxInProgress = false;

    if (isEnforce) {
        isLastPage = false;
        pageNumber = 0;
    }
    if (isLastPage || isAjaxInProgress) {
        return;
    }

    var pane = $('#pane');
    var qa = $('#question-wrapper');
    var isFetchTree = false;
    Mettl.AJAX({ url: "/corporate/skills/getQuestionAndSkillSummary",
        data: {
            d: null,
            n: pageNumber * 20,
            s: 20000,
            r: isFetchTree,
            t: tag,
            i: skillNodeId,
            qr: 'all'
        },
        beforeSend: function () {
            isAjaxInProgress = true;
            if (!isAppend) {
                pane.append('<div class="loading"><span></span></div>');
            }
        },
        success: function (data) {
            if (!data.success) {
                Mettl.QD.ShowErrorModal();
                return;
            }

            var newQuestions = JSON.parse(data.questions);

            if (isAppend) {
                questions = questions.concat(newQuestions);
                pane.find('._show-more button').remove();
            }
            else {
                questions = newQuestions;
            }

            if (newQuestions.length < 20) {
                isLastPage = true;
            }
            else {
                isLastPage = false;
                pageNumber++;
            }

            if (isFetchTree) {
                var skillTree = JSON.parse(data.skillTreeJson);
                skillObject = skillTree; //removeEmptySkills(skillTree);
                filterVars.fetchTree = false;
                if (toRefreshSkills) {
                    topicArray = [];
                    groupArray = [];
                    makeSkillArray(skillObject);
                }
                makeNodeTree(skillObject, false, filterVars.fetchTree ? false : true);
                updateTopicLists();
                updateSearchTopicLists();
            }
            var map = JSON.parse(data.difficultyLevelCountMap);
            renderQuestions(newQuestions, map, data.reviewedQuestionCount, skillNodeName, isAppend, false);
            if(sendGA){
                handleSearchGAEvent({searchText: filterVars.searchString, searchImpressions: map.EASY + map.MEDIUM + map.DIFFICULT});
            }

            var selectedQuestionsCount = qa.find('._question ._select._active').length;
            if (selectedQuestionsCount == 0) {

                var selectionArea = $("#pane-top ._selection-area");
                selectionArea.hide();
                selectionArea.siblings('._add-q-container').show();
            }
            var elem = document.getElementById("question-wrapper");
            if ('com' in window && 'wiris' in window.com && 'js' in window.com.wiris && 'JsPluginViewer' in window.com.wiris.js) {
                com.wiris.js.JsPluginViewer.parseElement(elem)
            }
        },
        error: function (xhr, textstatus, errorThrown) {
            Mettl.QD.ShowErrorModal();
        },
        complete: function () {
            isAjaxInProgress = false;
            pane.find('.loading').remove();
            // qa.find('._tooltip').tooltip({html: true, container: 'body',placement: 'top'});
        }
    });
}

var textFormatter = new function () {
    var blank = "___________";

    function makeSnippetEditable(text) {
        var dom = $("<div></div>").html(text);
        var snippets = dom.find("iframe._snippet");
        if (snippets.length) {
            snippets.each(function () {
                this.src = this.src.replace("ro=1", "");
            });
            return dom.html();
        }
        return text;
    }

    function hasEncodedHTML(text){
        var match = false ;

        if(!text){
            return match;
        }

        try{
            match = text.match(".*\\<[^>]+>.*");
        }catch(e){
            console.log(e.message);
        }

        return match;
    }

    return {
        format: function (text) {
            if (!hasEncodedHTML(text))
                text = "<pre class=\"text-only\">" + text + "</pre>";
            else
                text = "<div class=\"text-tags\">" +  text + "</div>";

            text = text.replace(/#blank#/gi, blank);
            return text;
        },
        unformat: function (text) {
            text = makeSnippetEditable(text);

            if (!hasEncodedHTML(text)) {
                text = "<pre>" + text + "</pre>";
            }

            return text;
        }
    };
};


function getQuestions(tagName) {
    getQuestionAndSkillSummary(tagName);
}


setInterval(() => {
    updateNodes('tagFilter', 'span.question-tag-name', e => {
        e.addEventListener('click', function () {
            console.log(e)
            getQuestions(e.innerText);
        })

    });


})

ifEnabled('', () => {
    setTimeout(() => {

    }, 10)
})
