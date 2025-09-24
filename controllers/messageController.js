
import Chat from './../models/Chat.js';
import User from './../models/user.js';
import axios from './../node_modules/axios/lib/axios.js';
import imagekit from './../configs/imageKit.js';
import openai from './../configs/openai.js';


// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id

        //Check credits
        if(req.user.credits < 1){
            return res.json({success: false, message: 'you dont have enough credits to use this feature'})
        }
        const { chatId, prompt } = req.body

        const chat = await Chat.findOne({ userId, _id: chatId })
        chat.messages.push({ role: 'user', content: prompt, timestamp: Date.now(), isImage: false })


        const { choices } = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = { ...choices[0].message, timestamp: Date.now(), isImage: false }
        res.json({ success: true, reply })

        chat.messages.push(reply)
        await chat.save()
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } })



    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//Image Generation Message Controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id
        //check credits
        if (req.user.credits < 2) {
            return res.json({ sucess: false, message: 'you dont have enough credits to use feature' })
        }

        const {prompt, chatId, isPublished} = req.body

        //find Chat
        const chat = await Chat.findOne({userId, _id: chatId})

        //Push user Message
        chat.messages.push({
            role: 'user',
            content:prompt,
            timestamp: Date.now(),
            isImage: false
        })

        //Encode the prompt
        const encodePrompt = encodeURIComponent(prompt)

        //Construct ImageKit AI generationn URL
        const generationImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/
        ik-genimg-prompt-${encodePrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`

        // trigger generation by fetching from ImageKit
        const aiImageResponse = await axios.get(generationImageUrl, {responseType: 'arraybuffer'})

        // Convert to Base64
        const base64Image = `date.image/png;base64,${Buffer.from(aiImageResponse.data,'binary')
            .toString('base64')
        }`

        //Upload to IMage Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: 'quickgpt'
        })

        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished
        }

        res.json({success: true, reply})


        chat.messages.push(reply)
            await chat.save()

            await User.updateOne({_id: userId}, {$inc: {credits: -2}})

    } catch (error) {
      res.json({ success: false, message:error.message})
    }
}