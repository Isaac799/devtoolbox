type PublicUser = {
    userID       : number
    userName     : string
    publicProfile: PublicProfile | null
    publicBabies : PublicBaby[]  | null
    internalGame : InternalGame  | null
}

function newPublicUser (userID: number, userName: string): PublicUser {
    return {
        userID,
        userName,
        publicProfile: null,
        publicBabies : null,
        internalGame : null,
    }
}

type PublicProfile = {
    profileID        : number
    profileBio       : string
    publicProfileUser: number
}

function newPublicProfile (profileID: number, profileBio: string, publicProfileUser: number): PublicProfile {
    return {
        profileID,
        profileBio,
        publicProfileUser,
    }
}

type PublicBaby = {
    babyID     : number
    babyTitle  : string
    publicUsers: PublicUser[] | null
}

function newPublicBaby (babyID: number, babyTitle: string): PublicBaby {
    return {
        babyID,
        babyTitle,
        publicUsers: null,
    }
}

type PublicUserPost = {
    publicUserPostUser: number
    publicUserPostPost: number
}

function newPublicUserPost (publicUserPostUser: number, publicUserPostPost: number): PublicUserPost {
    return {
        publicUserPostUser,
        publicUserPostPost,
    }
}

type InternalGame = {
    internalGamePlayers: number
    gameGold           : number
}

function newInternalGame (internalGamePlayers: number, gameGold: number): InternalGame {
    return {
        internalGamePlayers,
        gameGold,
    }
}
