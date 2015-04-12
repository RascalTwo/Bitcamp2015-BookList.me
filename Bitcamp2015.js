postCollection = new Mongo.Collection('posts')
postCollection.initEasySearch('title')

if (Meteor.isClient) {

	UI.registerHelper('formatTime', function(context){
		var hours = context.getHours()
		var amOrpm = 'AM'
		if (hours > 12){
			hours = hours - 12
			amOrpm = 'PM'
		}
		return (context.getMonth()+1) + '-' + context.getDate() + '-' + context.getFullYear() + ', ' + hours + ':' + context.getMinutes() + ' ' + amOrpm
	})

	UI.registerHelper('equal', function(thing1, thing2) {
		if(thing1 == thing2){
			return true
		}
		else{
			return false
		}
	})

	Router.route('/posts/:_id', function () {
		var item = postCollection.findOne({_id: this.params._id})
		this.render('postTemplate', {data: item})
	})

	Router.route('/', function () {
	})

	UI.body.helpers({
		posts: function (){
			return postCollection.find({}, {sort: {postDate: -1}})
		},
		atHome: function(){
			if (window.location.href.indexOf('posts') > -1){
				return false
			}
			else{
				return true
			}
		}
	})

	UI.body.helpers({
		getEmailByUsername: function(){
		/*	var users = Meteor.users.find({}).fetch()
			for (var i = 0; i < Meteor.users.find({}).fetch().length; i++){
				console.log(users[i])
			}*/

		//	$.ajax({
		//		url: 'http://api.reimaginebanking.com/atms?key=CUST782f4b0c6ec7add5d3bed44ce22c88ac',
		//		success: function(results){
		//			console.log(results)	
		//		}
		//	}); 
		}
	})

	$(document).ready(function() {
		$('.my-custom-link').click(function(){
			console.log('doing')
			$(document).trigger('coinbase_show_modal', '6ad16caf532b5d802a1141766ee4d823');
			return false;
		})

		$(document).on('coinbase_payment_complete', function(event, code){
			console.log("Payment completed for button " + code);
			//	window.location = "/confirmation.html";
		})
	})
	Template._loginButtonsLoggedInDropdown.events({
		'click #login-buttons-edit-profile': function(event) {
			Router.go('profileEdit');
		}
	})

	UI.body.events({
		'submit #submissionForm': function (event){
			event.preventDefault()
			failedReasons = []
			fields = [event.target.isbn.value, event.target.askingPrice.value, event.target.extraNotes.value]
			var qualityDropDown = document.getElementById('qualityDropDown')
			makePost = true
			for (var i = 0; i < fields.length-1; i++){
				if (fields[i] == ''){
					makePost = false
					failedReasons.push('You Left Required Fields Blank')
				}
			}
			if (fields[2].length > 200){
				makePost = false
				failedReasons.push('No More Then 200 Characters Are Allowed For Notes')
			}
			fields.push(qualityDropDown.options[qualityDropDown.selectedIndex].value)
			if (makePost == true){
				jQuery.getJSON('https://www.googleapis.com/books/v1/volumes?q=isbn:' + fields[0], function(data){
					makePost = true
					if (data.items == undefined){
						makePost = false
						failedReasons.push('ISBN Was Not Found, Make Sure You Typed It Correctly. ISBN Is Correct And You Are Still Getting This Error? Click On The Custom Book Menu Item Above.')
					}
					if (makePost == true){
						bookInfo = data.items[0].volumeInfo
						if (bookInfo.description != undefined){
							if (bookInfo.description.length > 300){
								bookInfo.description = bookInfo.description.substring(0, 297) + '...'
							}
						}
						if (bookInfo.authors == undefined){
							bookInfo.authors = ['Unknown']
						}
						if (fields[2] == ''){
							fields[2] = 'None'
						}
						if (bookInfo.imageLinks == undefined){
							bookInfo.imageLinks = ['no-image.gif']
						}
						postCollection.insert({
							isbn: fields[0],
							quality: fields[3],
							askingPrice: fields[1],
							extraNotes: fields[2],
							posterId: Meteor.userId(),
							posterName: Meteor.user().username,
							posterData: Meteor.user(),
							postDate: new Date(),
							title: bookInfo.title,
							subtitle: bookInfo.subtitle,
							author: bookInfo.authors[0],
							publisher: bookInfo.publisher,
							publishedDate: bookInfo.publishedDate,
							description: bookInfo.description,
							pageCount: bookInfo.pageCount,
							averageRating: bookInfo.averageRating,
							language: bookInfo.language,
							imageLink: bookInfo.imageLinks.thumbnail
						})
						for (var i = 0; i < fields.length-1; i++){
							fields[i] = ''
						}
					}
				})
			}
			else{
				for (var i = 0; i < failedReasons.length; i++){
					alert(failedReasons[i])
				}
			}

		},
		'click #deletePostButton': function (event){
			postCollection.remove(event.target.getAttribute('name'))
		}
	})

	Accounts.ui.config({
		requestPermissions: {},
		forceUsernameLowercase: true,
		forcePasswordLowercase: true,
		extraSignupFields: [{
			fieldName: 'username',
			fieldLabel: 'Username',
			inputType: 'text',
			visible: true,
			validate: function (value, errorFunction){
				if (!value){
					errorFunction("You need a Username to use this website");		
					return false;
				}
				else{
					return true;
				}
			},
			saveToProfile: true
		}]
	})
}
if (Meteor.isServer) {
	Meteor.startup(function (){
	})
}