export interface ScriptSample {
  id: string;
  title: string;
  anime: string;
  badge: string;
  recommendedVoice: string;
  recommendedPace?: number;
  text: string;
}

export const SAMPLE_SCRIPTS: ScriptSample[] = [
  {
    id: 'jjk-gojo-sukuna',
    title: 'Gojo vs Sukuna: Battle of the Strongest',
    anime: 'Jujutsu Kaisen',
    badge: 'Trending Recap',
    recommendedVoice: 'Puck',
    recommendedPace: 1.05,
    text: `Gojo Satoru ko dekhkar Sukuna bhi ek second ke liye shock ho gaya! Is fight mein Gojo apni full power use karta hai, lekin Sukuna ke paas ek aisa secret hai jo poori situation change kar deta hai. Shinjuku Showdown ke is moment par dono taraf se Unlimited Void aur Malevolent Shrine ka clash hota hai. Saare jujutsu sorcerers screens par bas yahi dekh rahe hain ki kya Gojo wakai modern era ka strongest sorcerer bana rahega ya Sukuna 1000 saal purana curse ban kar sab kuch tabah kar dega!`,
  },
  {
    id: 'solo-leveling-jinwoo',
    title: 'Sung Jinwoo: The Shadow Monarch Rises',
    anime: 'Solo Leveling',
    badge: 'Manhwa Hype',
    recommendedVoice: 'Charon',
    recommendedPace: 1.15,
    text: `Double Dungeon ke andar jab sabhi hunters surrender kar chuke the, tab Sung Jinwoo ne system ka secretive quest accept kiya. Weakest E-Rank hunter se lekar Shadow Monarch banne tak ka uska transformation unbelievable tha! Jab Jinwoo ne pehli baar bola "Arise", tab pure army of shadows uske command par khadi ho gayi. Ab na toh S-Rank hunters aur na hi Monarchs uski power ko suppress kar sakte hain!`,
  },
  {
    id: 'demon-slayer-infinity',
    title: 'Infinity Castle Arc: Akaza vs Tanjiro',
    anime: 'Demon Slayer',
    badge: 'Emotional Breakdown',
    recommendedVoice: 'Aoede',
    recommendedPace: 1.0,
    text: `Infinity Castle ke deep corridor mein jab Tanjiro aur Giyu ka samna Akaza se hota hai, tab atmosphere bilkul tense ho jata hai. Akaza ke compassionate flashback aur uski martial arts technique "Destructive Death" ke peeche ek aisi heart-breaking story chhipi hai jo har anime fan ki aankhon mein aansu la deti hai. Tanjiro ne Selfless State unlock karke Akaza ki compass needle ko bypass kar diya, jo is arc ka sabse iconic moment ban gaya!`,
  },
  {
    id: 'attack-on-titan-rumbling',
    title: 'Eren Jaeger: The Final Decision',
    anime: 'Attack on Titan',
    badge: 'Story Lore',
    recommendedVoice: 'Fenrir',
    recommendedPace: 0.95,
    text: `Paradis Island ki freedom ke liye Eren Jaeger ne ek aisa raasta chuna jise poori duniya kabhi maaf nahi kar sakti. Founding Titan ki power awaken hone ke baad millions of Wall Titans ne March shuru kar diya. Ye sirf ek war nahi tha, ye Eren ka ultimate sacrifice tha apne dosto ko ek safe future dene ke liye. Lekin kya Armin aur Mikasa use rok payenge ya Eldia ka fate hamesha ke liye seal ho chuka hai?`,
  },
  {
    id: 'reincarnated-slime-awakening',
    title: 'Rimuru Tempest: Reincarnated Demon Lord Awakening',
    anime: 'That Time I Got Reincarnated as a Slime',
    badge: 'Isekai Reincarnation',
    recommendedVoice: 'Leda',
    recommendedPace: 1.1,
    text: `Ek mortal human se direct slime mein reincarnate hone ke baad, Rimuru ne socha bhi nahi tha ki wo ek din Great Demon Lord ban jayega! "Great Sage" skill aur "Predator" power ke combination ne use unstoppable bana diya. Jab Falmuth kingdom ne Tempest par attack kiya, tab Rimuru ne Megiddo spell cast karke 20,000 soldiers ko ek second mein wipe out kar diya aur Harvest Festival shuru hua!`,
  },
];
