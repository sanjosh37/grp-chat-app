const socket = io()
// Elements

const $messageForm = document.querySelector('#msgform')
const $messageformInput = $messageForm.querySelector('input')
const $messageformButton = $messageForm.querySelector('button')
const $sendlocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//Options
const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage =  $messages.lastElementChild

    // Height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    console.log (newMessageStyles)

    // Visible hight
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const contentHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight  

    if (contentHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on ('message', (msg)=> {
    console.log ('msg', msg)
    const html = Mustache.render (messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on ('locationMessage', (msg)=> {
    console.log ('locationMsg:', msg)
    const location = Mustache.render(locationTemplate, {
        username: msg.username,
        location: msg.url,
        createdAt: moment(msg.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML('beforeend', location)
    autoscroll()
})

socket.on ('roomData', ({ room, users}) =>{
    const html =  Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageformButton.setAttribute('disabled', 'disabled')
    
    // const message = document.querySelector('input').value
    const message = e.target.elements.message.value
    socket.emit ('sendmsg', message, (error) => {
        $messageformButton.removeAttribute('disabled')
        $messageformInput.value = ''
        $messageformInput.focus()
        if (error) {
            return console.log ('Error: ', error)
        } 
        console.log ('Message delivered!.')
    })

})

$sendlocationButton.addEventListener('click', (e)=>{
    if (!navigator.geolocation) {
        return alert ('Geo Location is not supported in your browser')
    }
    $sendlocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log (position)
        socket.emit('sendLocation', {
            latitude : position.coords.latitude, 
            longitude : position.coords.longitude
        }, ()=>{
            $sendlocationButton.removeAttribute('disabled') 
            console.log ('Location shared')
        })   
          
    })
})

socket.emit ('join', {username, room}, (error)=>{
    if (error) {
        alert(error)
        location.href = '/'
    }
})