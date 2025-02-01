import Conversation from "../models/conversationSchema.js";
import User from "../models/userSchema.js";

export const getUserBySearch = async (req, res) => {
    try {
        const search = req.query.search || '';
        const currentUserID = req.user._id;
        
        const user = await User.find({
            $and: [
                {
                    $or:[
                        {username: {$regex: '.*'+search+'.*', $options: 'i'}},
                        {fullname: {$regex: '.*'+search+'.*', $options: 'i'}}
                    ]
                }, {
                    _id: {$ne: currentUserID}
                }
            ]
        }).select("-password").select("email")

        // console.log('Users Found:', user);

        res.status(200).send(user);

    } catch(err) {
        res.status(500).send({
            success: false,
            message: err
        })
        console.log(err);
    }
}

export const getCurrentChatters = async (req, res) => {
    try {
        const currentUserID = req.user._id;

        // Fetch conversations involving the current user
        const currentChatters = await Conversation.find({
            participants: currentUserID
        }).sort({ updatedAt: -1 });

        if (!currentChatters || currentChatters.length === 0) {
            return res.status(200).send([]);
        }

        // Get IDs of other participants
        const participantsIDs = currentChatters.reduce((ids, conversation) => {
            console.log('Conversation Participants:', conversation.participants);
            const otherParticipants = conversation.participants.filter(id => id && id.toString() !== currentUserID.toString());
            return [...ids, ...otherParticipants];
        }, []);

        console.log('Other Participant IDs:', participantsIDs);

        // Remove duplicates and ensure valid IDs
        const uniqueParticipantIDs = [...new Set(participantsIDs)].filter(id => id);

        // Fetch user data for the other participants
        const users = await User.find({ _id: { $in: uniqueParticipantIDs } }).select("-password -email");

        res.status(200).send(users);

    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
};


// export const getCurrentChatters = async (req, res) => {
//     try {
//         const currentUserID = req.user._id;
//         const currentChatters = await Conversation.find({
//             participants: currentUserID
//         }).sort({
//             updatedAt: -1
//         });

//         if(!currentChatters || currentChatters.length === 0) return res.status(200).send([]);

//         const participantsIDs = currentChatters.reduce((ids, conversation) => {
//             const otherParticipants = conversation.participants.filter(id => id !=  currentUserID);
//             return [...ids , ...otherParticipants]
//         }, []);

//         const otherParticipantsIDs = participantsIDs.filter(id => id.toString() != currentUserID.toString());

//         const user = await User.find({ _id: {$in: otherParticipantsIDs}}).select("-password").select("-email");

//         const users = otherParticipantsIDs.map(id => user.find(user => user._id.toString() === id.toString()));

//         res.status(200).send(users);
        
//     } catch(err) {
//         res.status(500).send({
//             success: false,
//             message: err
//         })
//         console.log(err);
//     }
// }