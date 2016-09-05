(function() {
	'use strict';

	var app = {
	 	init: function() {
			this.initLoginPage();
		},

		showLogin: function() {
			$('.ui.page.dimmer').dimmer({closable: false}).dimmer('show');
		},

		hideLogin: function() {
			$('.ui.page.dimmer').removeClass('active').dimmer('hide');
		},

		/**
		 * try login chat
		 */
		initLoginPage: function() {
			var username = $('.login__input').focus();

			$('.login__button').on('click', function() {
				app.login(username.val());
			});

			$('.login__input').on('keypress', function(e) {
				if (e.keyCode === 13) {
					app.login(username.val());
				}
			});
		},

		/**
		 * show login error
		 * @param  {string} text error text
		 */
		showLoginError: function(text) {
			$('.login__error .header').html(text);
			$('.login__error').css('display', 'block');
		},

		/**
		 * login chat, validation username
		 * @param  {string} username
		 */
		login: function(username) {
			if (/^[\wа-яА-Я]+$/.test(username)) {
				$.get('/login?username=' + username, function(data) {
					if (data === 'success') {
						$('.login__error').css('display', 'none');
						var socket = app.connect();
						app.username = username;
						socket.emit('add_user', username);
					} else {
						app.showLoginError('Логин занят!');
					}
				}).fail(function() {
					app.showLoginError('Проблемы с сервером. Зайдите позже.');
				})
			} else {
				app.showLoginError('Только буквы и цифры!');
			}
		},

		/**
		 * render chat users, add events for send messges
		 * @param  {array} users [description]
		 */
		initChat: function(users) {
			app.setChatMembers(users);
			app.messagesInput = $('.messages__input').focus();

			$('.messages__send').on('click', function() {
				app.sendMessage(app.messagesInput.val());
			});

			$('.messages__input').on('keypress', function(e) {
				if (e.keyCode === 13) {
					app.sendMessage(app.messagesInput.val());
				}
			});

			$('.signout').on('click', function() {
				location.reload();
			});
		},

		/**
		 * send message
		 * @param  {string} message
		 */
		sendMessage: function(message) {
			if (message) {
				var dt = new Date(),
					time = '[' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + ']',
					messageItem = app.createMessageItem(time, app.username, message);
				
				app.messagesInput.val('');
				app.addMessageItem(messageItem);
				app.socket.emit('new_message', {message: message, time: time});
			}
		},

		/**
		 * render chat users
		 * @param {array} users
		 */
		setChatMembers: function(users) {
			var userItem,
				user,
				isCurrent = false;

			for (var i = 0; i < users.length; i++) {
				var user = users[i];

				if (user === app.username) {
					isCurrent = true;
				}

				userItem = app.createUserItem(user, isCurrent);
				app.addUserItem(userItem);
			}
		},

		/**
		 * create user html element
		 * @param  {string}  username
		 * @param  {Boolean} isCurrent
		 * @return {string} user html element
		 */
		createUserItem: function(username, isCurrent) {
			var userItem;

			if (isCurrent) {
				userItem = '<span class="members__item current-user" id="' + username + '"><span></span>' + username + '</span>';
			} else {
				userItem = '<span class="members__item ' + username + '">' + username + '</span>';
			}

			return userItem;
		},

		/**
		 * render user
		 * @param {string} item user html element
		 */
		addUserItem: function(item) {
			$('.members__list').append(item);
		},

		/**
		 * create message html element
		 * @param  {string} time
		 * @param  {string} username
		 * @param  {string} message
		 * @return {string} message html element
		 */
		createMessageItem: function(time, username, message) {
			var messageItem = '<div class="message">';
			messageItem += '<span class="message__time">' + time + '</span>';
			messageItem += '<span class="message__username">' + username + ':</span>';
			messageItem += '<span class="message__text">' +  message+ '</span>';
			messageItem += '</div>'

			return messageItem;
		},

		/**
		 * render message
		 * @param {string} item
		 */
		addMessageItem: function(item) {
			$('.messages__list').append(item);
		},

		/**
		 * connect chat
		 * @return {object} socket
		 */
		connect: function() {
			var socket = app.socket = io();

			socket.on('login', function(data) {
				app.initChat(data.users);
				app.hideLogin();
			});

			socket.on('user_joined', function(data) {
				var messageItem = '<div class="message">';
				messageItem += '<span class="message__userinfo">Пользователь ' + data.username + ' присоединился к чату</span>';
				messageItem += '</div>';
				app.addMessageItem(messageItem);

				var userItem = app.createUserItem(data.username);
				app.addUserItem(userItem);
			});

			socket.on('user_left', function(data) {
				var messageItem = '<div class="message">';
				messageItem += '<span class="message__userinfo">Пользователь ' + data.username + ' покинул чат</span>';
				messageItem += '</div>';

				app.addMessageItem(messageItem);
				$('.' + data.username).remove();
			});

			socket.on('new_message', function(data) {
				var messageItem = app.createMessageItem(data.time, data.username, data.message);
				app.addMessageItem(messageItem);
			});

			return socket;
		}
	};

	window.app = app;
})();