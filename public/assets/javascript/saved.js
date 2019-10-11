$(document).ready(function(){
    // getting a reference to the article container div we will be rendering all articles inside of 
var articleContainer = $(".article-container");
// adding event listeners for dynamically generated buttons for deleting articles,
// pulling up article notes, saving article notes, and deleting article notes
$(document).on("click", ".btn.delete", handleArticleDelete);
$(document).on("click", ".btn.notes", handleArticleNotes);
$(document).on("click", ".btn.save", handleNoteSave);
$(document).on("click", ".btn.note-delete", handleNoteDelete);

// init page starts it
initPage();
 
function initPage(){
    // empty the article container, run an ajax request for saved headlines
    articleContainer.empty();
    $.get("/api/headlines?saved=true").then(function(data){
        // if we have headlines render them to the page
        if(data && data.length){
            renderArticles(data);

        }
        else{
            // otherwixe render message we have no articles
            renderEmpty();

        }
    });
}

function renderArticles(articles) {
    // this fn handles appending html containing our article data to the page
    // we are passed an array of json containing all available articles in our database
    var articlePanels = [];
    // we pass each article json object to the create panel fn which returns a bootstrap
    // panel with our article data inside
    for (var i =0; i<articles.length;i++){
        articlePanels.push(createPanel(articles[i]));
    }
    // once we have all of the html for the articles stroed in our articlePanels array,
    // append them to the article panels container
    articleContainer.append(articlePanels);

}
function createPanel(article){
    // this fn takes in a single json object for an article headline
    // it constructs a jquery element containing all of the formatted html for the 
    // article panel
    var panel = $([
        "<div class ='panel panel-default'>",
        "<div class = 'panel-heading'>",
        "<h3>",
        article.headline, 
        "<a class = 'btn btn-danger delete'>",
        "delete from saved",
        "</a>",
        "<a class = 'btn btn-info notes'> article notes</a>",
        "</h3>",
        "<div class='panel-body'>",
        article.summary,
        "</div>",
        "</div>"
    ].join(""));
    // we attach the articles id to the jquery element
    // we will use this when trying to figure out which article the user wants to remove or open notes for
    panel.data("_id", article._id);
    // we return the constructed panel jquery element
    return panel;
}
function renderEmpty(){
    // this fn renders some html to the page expaining we dont have any articles to view 
    // using a joined array of html string data because it's easier to read/change than a concatenated string

    var emptyAlert=
    $(["<div class='alert alert-warning text-center'>",
        "<h4>UhOh. Looks like we don't have any saved articles.</h4>",
        "</div>",
        "<div class='panel panel-default'>",
        "<div class='panel-heading text-center'>",
        "<h3> Would you like to browse available articles?</h3>",
        "</div>",
        "<div class = 'panel-body text-center'>",
        "<h4><a href='/'>Browse articles</a></h4>",
        "</div>",
        "</div>"
].join(""));
// appending this data to the page
articleContainer.append(emptyAlert);
}
function renderNotesList(data){
// this fn handles rendering note list items to our notes modal
// setting up an array of notes to render after finished
// also setting up a current not variable to temporarily store each note
var notesToRender = [];
var currentNote;
if(!data.notes.length){
    // if we have no notes just display a message explaining this
    currentNote = [
        "<li class = 'list-group-item'>",
      "no notes for this article yet",
      "</li>"

    ].join("");
    notesToRender.push(currentNote);
}
else{
    // if we do have notes go through each one
    for(var i =0; i<data.notes.lenth;i++){
        // constructs an li element to contain our note text and a delete button
        currentNote=$([
            "<li class='list-group-item note'>",
            data.notes[i].noteText,
            "<button class ='btn btn-danger note-delete'>x</button>",
            "</li>"
        ].join(""));
        // store the note id on the delete button for easy access when trying to delete
        currentNote.children("button").data("_id", data.notes[i]._id);
        // adding our currentNote to the notes to render arrary
        notesToRender.push(currentNote);
    }
}
$(".note-container").append(notesToRender);
}

function handleArticleDelete(){
    // this fn handles deleting articles and headlines
    // we grab the id of the article to delete from the panel element the delete button sits inside
    var articleToDelete = $(this).parents(".panel").data();
    // using a delete method here just to be semantic since we are deleting an article headline
    $.ajax({
        method:"DELETE",
        url:"/api/headlines/" + articleToDelete._id
    }).then(function(data){
        // if this works out run init page again which will rerender our list of saved articles
        if(data.ok){
            initPage();
        }
    });
}
function handleArticleNotes(){
    // this fn handles opending the notes modal and displaying our notes
    // we grab the id of the article to get notes for from the panel element the delete button sits inside
    var currentArticle = $(this).parents(".panel").data();
    // grab any notes with this headline/article id
    $.get("/api/notes/" + currentArticle._id).then(function(data){
        // constructing our initial html to add to the notes modal
        var modalText= [
            "<div class='container-fluid text-center'>",
            "<h4>Notes for article: ",
            currentArticle._id,
            "</h4>",
            "<hr />",
            "<ul class='list-group note-container'>",
            "</ul>",
            "<textarea placeholder='New note' rows='4' cols='60'></textarea>",
            "<button class='btn btn-success save'> save note</button>",
            "</div>"
        ].join("");
        // adding the formatted html to the note modal
        bootbox.dialog({
            message: modalText,
            closeButton:true
        });
        var noteData = {
            _id: currentArticle._id,
            notes:data||[]
        };
        // adding some info about the article and article notes to the save button for easy access
        // when trying to add a new note
        $(".btn.save").data("article", noteData);
        // rendernotes list will populate the actual note html of the modal we just created /opened
        renderNotesList(noteData);
    });
}
 
function handleNoteSave(){
    // this fn handle what happens when a user tries to save a new note for an article
    // setting a variable to hold some formatted data about our note,
    // grabbing the note typed into the input box
    var noteData;
    var newNote = $(".bootbox-body textarea").val().trim();
    // if we actually have data typed into the note input field, format it 
    // and post it to the api notes route and send the formatted ntoe data as well
    if(newNote){
        noteData={
            _id:$(this).data("article")._id,
            noteText: newNote
        };
        $.post("/api/notes", noteData).then(function(){
            // when complete close the modal
            bootbox.hideAll();
        });
    }
}


function handleNoteDelete(){
    // grab the id of the note we want to delete 
    // we stored this data on the delete button when we created it 
    var noteToDelete=$(this).data("_id");
    $.ajax({
        url:"/api/notes" + noteToDelete,
        method:"DELETE"
    })then(function(){
        bootbox.hideAll();
    });
}

});