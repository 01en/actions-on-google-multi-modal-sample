'use strict';

const {
    dialogflow,
    BasicCard,
    Image,
    NewSurface
} = require('actions-on-google');
const randomItem = require('random-item');
const functions = require('firebase-functions');
const app = dialogflow({
    debug: true
});
const dogList = [
    ['秋田犬', "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Akita_inu.jpeg/250px-Akita_inu.jpeg"],
    ['コーギー', "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Pembroke_Welsh_Corgi_600.jpg/220px-Pembroke_Welsh_Corgi_600.jpg"],
    ['柴犬', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Shiba_Inu.jpg/1280px-Shiba_Inu.jpg']
]
exports.main = functions.https.onRequest(app);

/**
 * アクション起動時
 */
app.intent('Default Welcome Intent', conv => {
    conv.ask("今日のオススメのわんこを教えてあげるよ。「今日のわんこ」って言ってみてワン")

    // DEBUG Surfaceの利用可能か確認
    // 画面を利用可能なデバイスが存在するかどうか
    const screenAvailable = conv.available.surfaces.capabilities.has('actions.capability.SCREEN_OUTPUT');
    // 現在の会話が画面付きのデバイスであるかどうか
    const screen = conv.screen
    console.debug("画面は利用可能か: " + screenAvailable)
    console.debug("現在画面があるか: " + screen)
})

/**
 * 今日のわんこを選択
 */
app.intent('Today Dog', conv => {
    const todayDog = randomItem(dogList)
    const dogName = todayDog[0]
    conv.ask('今日のわんこは、「' + dogName + '」' + 'です。画像を確認しますか?')

    // Intentが変わっても会話中に共通で参照できるように、選択されたわんこのデータを保存
    conv.data.dogName = dogName
    conv.data.dogImageUrl = todayDog[1]
})

/**
 * わんこの詳細を確認
 */
app.intent('Today Dog - yes', conv => {
    const dogName = conv.data.dogName

    if (conv.screen) {
        // 画面あるなら、画像を表示する
        const dogImageUrl = conv.data.dogImageUrl
        conv.ask(dogName + 'の画像はこちらです。')
        conv.close(new BasicCard({
            text: dogName,
            title: '今日のわんこ',
            image: new Image({
                url: dogImageUrl,
                alt: 'dogImage'
            })
        }))
    } else {
        const screenAvailable = conv.available.surfaces.capabilities.has('actions.capability.SCREEN_OUTPUT');
        if (screenAvailable) {
            // 画面が利用可能なデバイス(スマホ)に引き継ぐ
            const context = '今日のわんこの画像を確認しよう';
            const notification = '今日のわんこ「' + dogName + '」の画像を見よう';
            const capabilities = ['actions.capability.SCREEN_OUTPUT'];
            conv.ask(new NewSurface({ context, notification, capabilities }));
        } else {
            // 画像を表示できないので、終了する
            conv.close("ごめんなさい、わんこの詳細を確認できないワン")
        }
    }
})

/**
 * 新規Surface
 */
app.intent('New Surface', (conv, input, newSurface) => {
    if (newSurface.status === 'OK') {
        const dogName = conv.data.dogName
        const dogImageUrl = conv.data.dogImageUrl

        // Rich Responseを返却する時は、通常の会話文も返す必要がある。でないとエラーになるので注意。
        conv.ask(dogName + 'の画像はこちらです。')
        conv.close(new BasicCard({
            text: dogName,
            title: '今日のわんこ',
            image: new Image({
                url: dogImageUrl,
                alt: 'dogImage'
            })
        }))
    } else {
        // 会話の終了
        conv.close("ごめんなさい、わんこの詳細を確認できないワン")
    }
})