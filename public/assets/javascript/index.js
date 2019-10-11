$(document).ready(function(){
    // setting a reference to the article container div where all the dynamic content will go
    // adding event listeners to any dynamically generated "sae article"
    // and scrape new article buttons
    var articleContainer = $(".article-container");
    $(document).on("click", ".btn.save", handleArticleSave);
    $(document).on("click", ".scrape-new", handleArticleScrape);
    // once the page is ready, run the initPage function to kick things off
    initPage();

    function initPage(){
        // empty the article container, run an ajax request for any unsaved headlines 
        articleContainer.empty();
        $.get("/api/headlines?saved=false")
        .then(function(data){
            // if we have headlines, render them to the page
            if(data && data.length){
                renderArticles(data);
            }
            else{
                // otherwise render a message explaining we have no articles
                renderEmpty();
            }
        });
    }
 function renderArticles(articles){
    //  this function handles appnding html containing our article data to the page
    // we are passed an array of json containing all available articles in our database
    var articlePanels = [];
    // we pass each article json object to the createPanel function which returns a bootstrap
    // panel with our article data inside
    for (var i = 0; i<articles.length; i++){
        articlePanels.push(createPanel(articles[i]));
    }
    // once we have all of the html for the articles stored in our article Panels array
//  append them to the articlePanels container
articleContainer.append(articlePanels);
}
function createPanel(article){
    // this fn takes in a single json object for an article/headline
    // it constructs a jquery element containing all of the formatted html for the 
    // article panel
    var panel = 
    $(["<div class='panel panel-default'>",
        "<div class='panel-heading'>",
        "<h3>",
        article.headline,
        "<a class='btn btn-success save'>",
        "Save Article",
        "</a>",
        "<h3>",
        "</div>",
        "<div class = 'panel-body'>",
        article.summary,
        "</div>",
        "</div>"

].join(""));
// we attach the articles id to the jquery element
// we will use this when trying to figure out which article the user wants to save
panel.data("_id", article._id);
// we return the constructed panel jquery element
return panel;
}
 function renderEmpty(){
    //  this function renders some html to the page explaining we don't have any articles to view
    // using a joined array of html string data because it's easier to read/change than a concatenated string
    var emptyAlert = 
    $(["<div class='alert alert-warning text-center'>",
        "<h4>Uh Oh. Looks like we don't have any new articles.</h4>",
        "</div>",
        "<div class = 'panel panel-default'>",
        "<div class= 'panel-heading text-center'>",
        "<h3>What would you like to do?</h3>",
        "</div>",
        "<div class = 'panel-body text-center'>",
        "<h4><a class = 'scrape-new'> Try scraping new articles</a></h4>",
        "<h4><a href='/saved'>Go to saved articles</a></h4>",
        "</div>",
        "</div>"
].join(""));
// appending this data to the page
articleContainer.append(emptyAlert);
 }

 function handleArticleSave(){
    //  this fn is triggered when the user wants to save an article
    // when we rendered the article initially, we attached a javascript object containing the 
    // headline id
    // to the element using the .data method. Here we retrieve that
    var articleToSave = $(this).parents(".panel").data();
    articleToSave.saved=true;
    // using a patch method to be semantic since this is an update to an existing record in our collection
    $.ajax({
        method:"PATCH",
        url:"/api/headlines",
        data: articleToSave
    })
    .then(function(data){
        // if successful, mongoose will send back an object containing a key of ok with the value of 1
        // which casts to true
        if (data.ok){
            // run the init page fn again this will reload the entire list of articles
            initPage();
        }
    });
 }


 function handleArticleScrape(){
    //  this fn handles the user clicking any scrape new article buttons
    $.get("/api/fetch")
    .then(function(data){
        // if we are able to succesfully scrape the NYtimes and compare the articles to those
        // already in our collection, re render the articles on the page
        // and let the user know how many unique articles we were able to save
        initPage();
        bootbox.alert("<h3 class = 'text-center m-top-80'>" + data.message + "<h3>");
    });
 }
});