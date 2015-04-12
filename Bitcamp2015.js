postCollection = new Mongo.Collection('posts')
postCollection.initEasySearch('title')

if (Meteor.isClient){

	latestjQueryResults = null
	tempGlobalVariable = null

	function capitalOne(action, secondAction, variable, secondVariable){
		apiText = null
		if (action == 'get'){
			if (secondAction == 'customers'){
				apiText = 'customers'
			}
			else if (secondAction == 'customerById'){
				apiText = 'customers/' + variable
			}
			else if (secondAction == 'accountsByCustomerId'){
				apiText = 'customers/' + variable + '/accounts'
			}
			else if (secondAction == 'accounts'){
				apiText = 'accounts'
			}
			else if (secondAction == 'accountById'){
				apiText = 'accounts/' + variable
			}
			else if (secondAction == 'customerByAccountId'){
				apiText = 'accounts/' + variable + '/customer'
			}
			else if (secondAction == 'transactionsByAccountId'){
				apiText = 'accounts/' + variable + '/transactions'
			}
			if (apiText == null){
				return false
			}
			jQuery.ajax({
				url: 'http://api.reimaginebanking.com:80/' + apiText + '?key=CUST782f4b0c6ec7add5d3bed44ce22c88ac',
				async: false,
				success: function(results){
					latestjQueryResults = results
				}
			})
		}
		else if (action == 'post'){
			if (secondAction == 'transaction'){
				apiText = 'accounts/' + variable + '/transactions'
			}
			if (apiText == null){
				return false
			}
			jQuery.ajax({
				type: "POST",
				url: 'http://api.reimaginebanking.com:80/' + apiText + '?key=CUST782f4b0c6ec7add5d3bed44ce22c88ac',
				data: '{"transaction_type":"cash","payee_id":"552a335790fb30ee365b3a57","amount":' + secondVariable + '}',
				success: function(data){
					alert('Thank You! Your Post Has Now Been Submitted! Best Of Luck Getting A Buyer!')
				},
				dataType: 'json',
				contentType: "application/json; charset=utf-8"
			})
		}
	}

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

	Router.route('/', function (){
	})

	UI.body.helpers({
		posts: function (){
			return postCollection.find({}, {sort: {postDate: -1}})
		}
	})

	Template._loginButtonsLoggedInDropdown.events({
		'click #login-buttons-edit-profile': function(event) {
			document.getElementById('editProfileDivP1').style.display='block'
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
						makePost = false
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
						if (event.target.debugCheckbox.checked == true){
							makePost = true
						}
						account = null
						if (tempGlobalVariable == null){
							alert('You Have Not Entered Your Account Information Or You Have But Left The Page After The Information Had Expired. (It Does This For Security Purposes)')
							makePost = false
						}
						else{
							capitalOne('get', 'accountById', tempGlobalVariable[1], null)
							account = latestjQueryResults
							if (account.balance-0.5 > 0){
								capitalOne('post', 'transaction', tempGlobalVariable[1], 0.5)
								makePost = true
							}
							else{
								alert('Your Account Does Not Have The 50 Cents Required To Complete This Transaction.')
								makePost = false
							}
						}
						if (makePost == true){
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
						}
						for (var i = 0; i < fields.length-1; i++){
							fields[i] = ''
						}
					}
					else{
						alert(failedReasons[0])
					}
				})
			}
			else{
				for (var i = 0; i < failedReasons.length; i++){
					alert(failedReasons[i])
				}
			}
		},
		'submit #deletePostForm': function (event){
			event.preventDefault()
			postCollection.remove(event.target.deletePostButton.getAttribute('name'))
			return false
		},
		'submit #getEmailByUsername': function (event){
		},
		'submit #editProfileDivP1': function (event){
			event.preventDefault()
			alert('None Of This Information You Are About To Enter Will Remain Within This Website.')
			capitalOne('get', 'customers', null, null)
			customers = latestjQueryResults
			foundAccount = true
			customer = null;
			for (var i = 0; i < customers.length; i++){
				foundCustomer = true
				if (customers[i].first_name != event.target.firstName.value){
					foundCustomer = false
				}
				if (customers[i].last_name != event.target.lastName.value){
					foundCustomer = false
				}
				if (foundCustomer == true){
					foundAccount = true
					customer = customers[i]
				}
			}
			if (customer == null){
				foundAccount = false
			}
			if (foundAccount == false){
				alert('That Combination Of First And Last Name Was Not Found Within The Capitol One Database.')
			}
			else{
				if (customer.accounts.length < 1){
					alert('You Have Been Found, But It Appears That You Have No Accounts Within The Capitol One Database.')
					document.getElementById('editProfileDivP1').style.display='none'
				}
				else{
					tempGlobalVariable = customer
					document.getElementById('editProfileDivP1').style.display='none'
					document.getElementById('editProfileDivP2').style.display='block'
				}
			}
		},
		'submit #editProfileDivP2': function (event){
			event.preventDefault()
			fields = [event.target.streetNumber.value, event.target.streetName.value, event.target.city.value, event.target.state.value, event.target.zip.value, event.target.accountId.value]
			customer = tempGlobalVariable
			verifiedAccount = true
			failedFields = []
			if (customer.address.street_number != fields[0]){
				failedFields.push('Street Number')
				verifiedAccount = false
			}
			if (customer.address.street_name != fields[1]){
				failedFields.push('Street Name')
				verifiedAccount = false
			}
			if (customer.address.city != fields[2]){
				failedFields.push('City')
				verifiedAccount = false
			}
			if (customer.address.state != fields[3]){
				failedFields.push('State')
				verifiedAccount = false
			}
			if (customer.address.zip != fields[4]){
				failedFields.push('Zip')
				verifiedAccount = false
			}
			if (verifiedAccount == false){
				failedFieldsString = null
				if (failedFields.length > 0){
					for (var i = 0; i < failedFields.length; i++){
						if (i == 0){
							failedFieldsString = ''
						}
						failedFieldsString = failedFieldsString + ', ' + failedFields[i]
					}
				}
				alert('The Following Fields Did Not Match What Was Found In The Capital One Database: ' + failedFieldsString)
			}
			else{
				useSuppliedAccount = false
				if (customer.accounts.length > 1){
					for (var i = 0; i < customer.accounts.length; i++){
						if (customer.accounts[i] == fields[5]){
							useSuppliedAccount = true
						}
					}
				}
				accountId = customer.accounts[0]
				if (useSuppliedAccount == true){
					accountId = fields[5]
				}
				tempGlobalVariable = [customer, accountId]
				alert('Congragulations! You Have Setup Your Account For This Session!')
				document.getElementById('editProfileDivP2').style.display='none'
			}
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
			saveToProfile: false
		}]
	})

}