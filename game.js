const webSocketsUrl = "wss://cardgamebackend-4leo.onrender.com/ws"


$(document).ready(() => {
    const socket = new WebSocket(`${webSocketsUrl}/game`)

    socket.onopen = () => {
        console.log("Connected")
    }

    socket.onmessage = message => {
        const res = handleMessage(JSON.parse(message.data))
        if (res.respond) {
            socket.send(JSON.stringify(res.data))
        }
    }

    socket.onclose = () => { 
    }

    socket.onerror = error => {
        console.log("error")
        console.log(error)
    }

    let selectedCard = null

    $(".self-inv-div").click(e => {
        $(".self-inv-div").removeClass("selected")
        const cardNo = parseInt(e.target.id.split("-")[1])
        selectedCard = cardNo
        $(e.target).addClass("selected")
    })
    
    $(".grid-cell").click(e => {
        if (selectedCard === null) {
            return
        }

        const gridPos = parseInt(e.target.id.split("-")[1])
        const gameId = parseInt(sessionStorage.getItem("gameId"))
        const player = parseInt(sessionStorage.getItem("player"))

        const data = {
            type: "move",
            name: "move",
            gameId: gameId,
            player: player,
            cardNo: selectedCard,
            gridPos: gridPos,
        }

        socket.send(JSON.stringify(data))
        selectedCard = null
        $(".self-inv-div").removeClass("selected")

    })

})


const handleMessage = messageJson => {
    const messageName = messageJson.name
    console.log(messageJson)

    if (messageName === "game setup") {
        handleSetup(messageJson)
        return {
            respond: true,
            data: {
                type: "ready",
                name: "ready",
                gameId: parseInt(sessionStorage.getItem("gameId")),
                player: parseInt(sessionStorage.getItem("player"))
            }
        }
    } else if (messageName === "move") {
        return handleMove(messageJson)
    }

    return {
        respond: false
    }
}

const handleSetup = data => {
    sessionStorage.setItem("gameId", data.gameId)
    sessionStorage.setItem("player", data.player)

    displayInvCards(data.invHands)
}


const handleMove = data => {
    console.log(data)
    // display it here
    displayInvCards(data.invHands)
    console.log("displaying")
    displayEvents(data.events)

    const terminationSet = new Set(["DRAW", "BLUE_VICTORY", "RED_VICTORY"])
    if (terminationSet.has(data.gameStatus)) {
        console.log("terminating")
        handleGameEnd(data.gameStatus)
    }

    return {
        respond: false
    }


}


const handleGameEnd = gameStatus => {
    if (gameStatus === "DRAW") {
        $("#results").text("Draw!")
        return
    }

    const winner = gameStatus === "BLUE_VICTORY" ? 1 : 2
    const playerNo = parseInt(sessionStorage.getItem("player"))

    const resultText = (winner === playerNo) ? "You win :D" : "You lost :("
    $("#results").text(resultText)
}


const displayInvCards = invCards => invCards.forEach((val, idx) => displayCard(idx, val))


const displayCard = (cardNo, cardData) => {
    const divId = `self-${cardNo}`
    const htmlDiv = (cardData === null) ? "" : `
        <span class="top">${cardData.up}</span>
        <span class="left">${cardData.left}</span>
        <span class="right">${cardData.right}</span>
        <span class="bottom">${cardData.down}</span>
        <span class="center">${cardData.name[0]}</span>
    `

    $(`#${divId}`).html(htmlDiv)
    if (cardData === null) {
        $(`#${divId}`).removeClass("self-card")
    } else {
        $(`#${divId}`).addClass("self-card")
    }
}

const displayGridCard = (cardNo, cardData, player) => {
    const divId = `grid-${cardNo}`
    const htmlDiv = `
        <span class="top">${cardData.up}</span>
        <span class="left">${cardData.left}</span>
        <span class="right">${cardData.right}</span>
        <span class="bottom">${cardData.down}</span>
        <span class="center">${cardData.name[0]}</span>
    `

    $(`#${divId}`).html(htmlDiv)

    if (player === parseInt(sessionStorage.getItem("player"))) {
        $(`#${divId}`).addClass("self-card")
    } else {
        $(`#${divId}`).addClass("opp-card")
    }
}


const flipCard = (gridPos, oldPlayer) => {
    const playerNo = parseInt(sessionStorage.getItem("player"))
    if (oldPlayer === playerNo) {
        $(`#grid-${gridPos}`).removeClass("self-card")
        $(`#grid-${gridPos}`).addClass("opp-card")
    } else {
        $(`#grid-${gridPos}`).addClass("self-card")
        $(`#grid-${gridPos}`).removeClass("opp-card")
    }
}


const displayEvents = events => {
    events.forEach(async event => {
        displayEvent(event)
    })
}


const displayEvent = event => {
    if (event.name === "Card Enters") {
        const gridPos = event.gridPos
        displayGridCard(gridPos, event.card, event.player)
        
        if (event.player !== parseInt(sessionStorage.getItem("player"))) {
            // opponent played this
            const cardNo = event.cardNo
            $(`#opp-${cardNo}`).removeClass("unknown")
        }

    } else if (event.name === "Flip") {    
        flipCard(event.gridPos, event.oldPlayer)
    }
}
