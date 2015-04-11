postCollection = new Mongo.Collection('posts')

if (Meteor.isClient) {


	Template.body.helpers({
		loggedIn: function (){
			if (Meteor.userId() == null){
				return false
			}
			else{
				return true
			}
		},
		posts: function (){
			return postCollection.find({}, {sort: {postDate: -1}})
		}
	})

	Template.body.events({
		'submit #submissionForm': function (event){
			event.preventDefault()
			fields = [event.target.bookName.value, event.target.isbn.value, event.target.quality.value, event.target.askingPrice.value]
			makePost = true
			for (var i = 0; i < fields.length; i++){
				if (fields[i] == ''){
					makePost = false
				}
			}
			if (makePost == false){
				alert('All Fields Must Be Filled Out!')
			}
			else{
				postCollection.insert({
					bookName: fields[0],
					isbn: fields[1],
					quality: fields[2],
					askingPrice: fields[3],
					posterId: Meteor.userId(),
					posterName: Meteor.user().username,
					postDate: new Date()
				})
			}
		}
	})

	Accounts.ui.config({
		passwordSignupFields: 'USERNAME_ONLY'
	})
}

if (Meteor.isServer) {
	Meteor.startup(function (){

	})
}
