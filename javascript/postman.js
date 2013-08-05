// get the URL of the active tab and paste it in the postcard
var url;
chrome.tabs.query({'active': true}, function(tabs){
    url = tabs[0].url;
    // check the length of the url, if it's too long, we restrict it to 100 characters and append three dots (...)    
    if (url.length > 100){
        urlToShow = url.substring(0,100);
        urlToShow = urlToShow.concat("...");
    } else {
        urlToShow = url;
    }
    // because chrome.tabs.query is an asynchronous function, we can't do with the url what we want in this function
    // we need to create a second function, because otherwise the variable url will still be undefined when we're already trying to work with it
    urlFunction(urlToShow);
});

// function to paste the URL of the active tab in the extension html
function urlFunction(link){
    document.getElementById('linkURL').innerHTML = link;
}
// function to show a div
function showDiv(id){
    document.getElementById(id).style.display = "block";
}
// function to hide a div
function hideDiv(id){
    document.getElementById(id).style.display = "none";
}

// chrome extensions don't support inline javascript
// so we need to add event listeners to our DOM
document.addEventListener('DOMContentLoaded', function(){
    
    // this function listens to the sendmail button
    // when the button is clicked, it will get the e-mail address from the input field,
    // store the address in html5 localStorage, compose the e-mail message
    // and open the user's e-mail client with the Postman e-mail ready to be sent
    document.getElementById("sendMailButton").addEventListener('click', function(){
        // get the e-mail address from the input field
        recipient = document.getElementById('emailInput').value;
        
        // validate the e-mail address before saving & using it
        var emailRegex = /^[A-Z0-9._%\+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
        if (recipient.search(emailRegex) == -1){
            document.getElementById('errorMessage').innerHTML = '<a href="http://www.youtube.com/watch?v=Z54-QHEZN6E" target="_blank">Return to sender ... address unkown!</a>';
            document.getElementById('emailSearch').setAttribute('class','hidden');
        } else {
            // save the e-mail address in html5 localStorage
            storedEmailsString = localStorage["email"];
            storedEmailsArray = storedEmailsString.split(",");
            if (storedEmailsString.length == 0){
                storedEmailsString = recipient;
            } else {
                if (storedEmailsArray.indexOf(recipient) == -1){
                    storedEmailsString = storedEmailsString + "," + recipient;
                }
            }
            localStorage["email"] = storedEmailsString;
            // compose the message
            sender = localStorage["username"];
            // replace the possible & in the url by its URL-encoding counterpart
            // without this, the e-mail body text will be cut off at the first & encountered
            var urlToSend = url.replace(/&/g,"%26");
            messageBody = "Check%20out%20this%20link!%0D%0D" + urlToSend + "%0D%0D" + sender + "%0D%0D%0D%20-%20delivered%20by%20Postman%20-";
            var mail = "mailto:" + recipient + "?subject=Postman%20delivery&body=" + messageBody;
            // open the e-mail client
            chrome.tabs.update({url: mail});
        }
    });
    
    // this function listens to the sendName button
    // it gets the username from the input field and stores it in html5 localStorage
    // at the same time, it creates the email key in localStorage that will be used to save the e-mail addresses entered by the user
    // finally, it hides the start screen and shows the screen to send an e-mail
    // this function will only be used when someone uses the extension for the first time, or after a reset
    document.getElementById('sendNameButton').addEventListener('click',function(){
        usernameValue = document.getElementById('username').value;
        localStorage["username"] = usernameValue;
        // at the same time, create an email key to store the e-mail addresses that the user enters
        localStorage["email"] = "";
        document.getElementById('sender').innerHTML = localStorage["username"];
        showDiv('nameKnown');
        hideDiv('nameUnknown');
    });
    
    // this function listens to the reset button
    // it removes both the username and saved e-mail addresses from localStorage
    document.getElementById('resetButton').addEventListener('click',function(){
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        location.reload(true);
    });
    
    // this function listens to the e-mail input field
    // when a user types in this field (function runs on keyup event), the letters typed are compared to the stored e-mail addresses
    // when there's a match between what has been stored and what's being typed, the matching addresses are show in a suggestion box under the input field
    document.getElementById('emailInput').addEventListener('keyup',function(){
        
        // clear the suggestion box by removing all the child elements
        document.getElementById('emailSearch').innerHTML = '';
        
        // get the letters that were typed by the user
        var str = escape(document.getElementById('emailInput').value);
        
        if (str.length > 0){
            // read the saved addresses from localStorage
            storedEmailsString = localStorage["email"];
            
            // transform the email string into an array and check if any of the addresses start with the letters written by the user
            var emailArray = storedEmailsString.split(",");
            var matchFound = false;
            
            for (var i = 0; i < emailArray.length; i++){
                emailStart = emailArray[i].substring(0,str.length);
                if (emailStart == str){
                    matchFound = true;
                    // match was found, add a new child div to the suggestion box
                    var newDiv = document.createElement('div');
                    newDiv.setAttribute('class','suggestionMouseOut');
                    newDiv.innerHTML = emailArray[i];
                    newDiv.addEventListener('mouseover',function(){
                        // give the div the class suggestionMouseOver when a user hovers over the div
                        this.setAttribute('class','suggestionMouseOver');
                    });
                    newDiv.addEventListener('mouseout',function(){
                        // give the div the class suggestionMouseOut when a user moves the mouse away from the div
                        this.setAttribute('class','suggestionMouseOut');
                    });
                    newDiv.addEventListener('click',function(){
                        // set the clicked address as the value in the input field
                        document.getElementById('emailInput').value = this.innerHTML;
                        // and at the same time hide the suggestion box
                        document.getElementById('emailSearch').innerHTML = '';
                        document.getElementById('emailSearch').setAttribute('class','hidden');
                    });
                    document.getElementById('emailSearch').appendChild(newDiv);
                    document.getElementById('emailSearch').setAttribute('class','visible');
                }
            }
            // when the for loop has gone through all the stored e-mail addresses, but no match was found, the suggestion box has to be hidden again
            if (!matchFound){
                document.getElementById('emailSearch').setAttribute('class','hidden');
            }
            
        } else {
            document.getElementById('emailSearch').innerHTML = '';
            document.getElementById('emailSearch').setAttribute('class','hidden');
            document.getElementById('errorMessage').innerHTML = '';
        }
        
    });
    
});

// when the extension is opened, this function checks whether a username has been saved before or not
// if there is a username in localStorage, the e-mail screen is shown
// otherwise, the 'get to know your Postman' page is shown
window.onload = function(){
    if (localStorage.username) {
        // show the div nameKnown, hide the div nameUnknown
        showDiv('nameKnown');
        hideDiv('nameUnknown');
        // set the username as the sender
        document.getElementById('sender').innerHTML = localStorage.username;
    } else {
        // show the div nameUnknown, hide the div nameKnown
        // the div nameUnknown is shown by default, so this isn't really needed
        hideDiv('nameKnown');
        showDiv('nameUnknown');
    }
}

