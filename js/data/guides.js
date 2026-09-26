// Guided prayer for Before the Throne: the prayer methods walked through in
// the pray view, the opening and closing of every session, the Scripture
// warrant for each default category, the Lord's Day card, and the Learn essays.
//
// Rules for this file:
// - Every ref in a `verses` field (and in CATEGORY_WARRANTS, BENEDICTIONS,
//   OPENING, CLOSING and LORDS_DAY) is one of the canonical refs quoted in
//   js/data/scripture.js. Any other passage appears only in `seeAlso`, which
//   the views render as a link to esv.org and never quote.
// - `wsc` numbers point at the Westminster Shorter Catechism, `wcf` strings at
//   chapter 21 of the Confession ('21.3'), `wlc` numbers at the Larger
//   Catechism on prayer (178-196). Those are the texts the app carries.
// - App-authored prose uses no em or en dashes and speaks of God with
//   lowercase pronouns, as the ESV does.
//
// Self-contained data module: no imports. The category ids below match
// DEFAULT_CATEGORIES in ./categories.js.

// ---------------------------------------------------------------------------
// Category warrants: one verse shown with each default category.
// ---------------------------------------------------------------------------

export const CATEGORY_WARRANTS = {
  soul: '1 Thessalonians 5:23-24',
  family: 'Acts 2:39',
  church: 'Ephesians 3:14-19',
  friends: 'Colossians 1:9-12',
  lost: 'Romans 10:1',
  missions: 'Matthew 9:37-38',
  persecuted: 'Hebrews 13:3',
  rulers: '1 Timothy 2:1-4',
  other: 'Philippians 4:6-7',
};

// ---------------------------------------------------------------------------
// Opening and closing of every prayer session.
// ---------------------------------------------------------------------------

export const BENEDICTIONS = [
  'Numbers 6:24-26',
  'Jude 24-25',
  'Hebrews 13:20-21',
  '2 Corinthians 13:14',
  'Romans 15:13',
];

export const OPENING = {
  id: 'opening',
  title: 'Draw near',
  verses: ['Hebrews 4:16'],
  prompt: 'Be still for a moment and remember whom you are coming to. You come as a child to a Father who delights to hear you. You do not come in your own worth, for Christ has opened the way by his blood. Ask your Father to quiet your heart by his Spirit and help you pray.',
};

// pray.js swaps in the day’s benediction from BENEDICTIONS (see
// benedictionForDay below); this default is the Aaronic blessing.
export const CLOSING = {
  id: 'closing',
  title: 'Amen',
  verses: ['Numbers 6:24-26'],
  prompt: 'Commit everything you have asked into your Father’s hands, and trust him to answer in his own time and way. Say Amen in faith, as one who expects to be heard. Then go your way under his blessing, knowing that Christ goes on praying for you after you rise from your knees.',
};

// ---------------------------------------------------------------------------
// The Lord's Day card on Today (Sundays).
// ---------------------------------------------------------------------------

export const LORDS_DAY = {
  title: 'The Lord’s Day',
  verses: ['Exodus 20:8', 'Isaiah 58:13-14'],
  prompt: 'This is the day the Lord has made for holy rest and for worship with his people. Ask him to bless the preaching of his Word today and to make your heart glad in his house. Remember your minister as he leads, and pray for any who are kept from worship by sickness or necessity.',
};

// ---------------------------------------------------------------------------
// Prayer methods. Step ids are unique across all methods.
// STEP = { id, title, subtitle?, wsc?, verses, prompts, requests?, showAnswered?, seeAlso? }
// ---------------------------------------------------------------------------

export const METHODS = [
  {
    id: 'lords-prayer',
    name: 'The Lord’s Prayer',
    short: 'Pray by the pattern Christ gave',
    description: 'Christ gave this prayer to his disciples, and the Shorter Catechism calls it the special rule of direction in prayer (Q. 99). You will pray through it one petition at a time, bringing each of your requests under the petition where it belongs.',
    steps: [
      {
        id: 'lp-preface',
        title: 'Our Father in heaven',
        subtitle: 'The preface',
        wsc: 100,
        verses: ['Matthew 6:9-13', 'Matthew 7:11'],
        prompts: [
          'Christ teaches you to call God your Father. Through faith in his Son you have been adopted into his family. So you may come with holy reverence and also with the confidence of a child.',
          'Your Father is in heaven, high above all things and able to do whatever he pleases. He is ready to help you, so bring your needs to him without fear.',
          'Christ taught you to say “our Father.” You pray as one member of a great family, so pray with the whole church and for others as well as for yourself.',
        ],
        seeAlso: ['Romans 8:15-16', 'Galatians 4:4-7'],
      },
      {
        id: 'lp-hallowed',
        title: 'Hallowed be your name',
        subtitle: 'The first petition',
        wsc: 101,
        verses: ['Psalm 145:3', 'Isaiah 6:3'],
        prompts: [
          'Before you ask for anything, take time simply to adore God. Tell him that he is holy and worthy of all praise, and praise him for the mercy he has shown you in Christ.',
          'God’s name is everything by which he makes himself known. Ask him to enable you and others to glorify him in all of it, so that your words and work today honor his name.',
          'Ask him to dispose all things to his own glory, including the hard things in your life that you do not understand.',
        ],
      },
      {
        id: 'lp-kingdom',
        title: 'Your kingdom come',
        subtitle: 'The second petition',
        wsc: 102,
        verses: ['Psalm 2:8', 'Habakkuk 2:14', 'Revelation 22:20'],
        requests: ['church', 'lost', 'missions', 'persecuted'],
        prompts: [
          'Pray that Satan’s kingdom would be torn down and that Christ’s kingdom of grace would advance through the preaching of the gospel.',
          'Pray for your church and its elders, and for the people you know who are still outside of Christ. Ask God to grant them repentance and give them new hearts.',
          'Remember missionaries and believers who suffer for Christ’s name, and ask God to keep his people faithful. Then join the church of every age in praying, “Come, Lord Jesus!”',
        ],
        seeAlso: ['Matthew 28:18-20', 'Romans 11:25-26'],
      },
      {
        id: 'lp-will',
        title: 'Your will be done, on earth as it is in heaven',
        subtitle: 'The third petition',
        wsc: 103,
        verses: ['Luke 22:42', 'Psalm 40:8'],
        requests: ['rulers'],
        prompts: [
          'Ask God by his grace to make you able and willing to know and obey his will, as the angels do in heaven. Name one duty today that you find hard, and ask for strength to do it gladly.',
          'Submit to his will in the things his providence has sent into your life. You may pray with your Savior, “not my will, but yours, be done.”',
          'Pray for those who rule over your nation and your town. Ask God to give them wisdom to govern justly and hearts that honor Christ as King of kings.',
        ],
        seeAlso: ['Romans 12:1-2', 'Psalm 2:10-12'],
      },
      {
        id: 'lp-bread',
        title: 'Give us this day our daily bread',
        subtitle: 'The fourth petition',
        wsc: 104,
        verses: ['Proverbs 30:8-9', 'Philippians 4:19'],
        requests: ['family', 'friends', 'other', 'unassigned'],
        prompts: [
          'Everything you have comes as God’s free gift. Ask him for a fitting portion of the good things of this life for today, and ask him to bless them to you.',
          'Bring the needs of your household by name, like work and wages or health and strength for the day. Pray for your friends and neighbors in their needs as well.',
          'Ask for a contented heart. Pray that you would not forget God when you have plenty, nor dishonor him when you are in want.',
        ],
      },
      {
        id: 'lp-forgive',
        title: 'And forgive us our debts, as we also have forgiven our debtors',
        subtitle: 'The fifth petition',
        wsc: 105,
        verses: ['1 John 1:8-9', 'Micah 7:18-19', 'Ephesians 4:32'],
        prompts: [
          'Confess your sins to God plainly and by name. Ask him to show you by his Spirit what you have done and what you have left undone since you last prayed.',
          'Ask God to pardon you freely for Christ’s sake. Your debt is great, but Christ paid it in full on the cross. Your Father will not require it of you again.',
          'Is there anyone you have not forgiven? Forgive them now from the heart, as God in Christ forgave you. Ask for grace to show them kindness.',
        ],
        seeAlso: ['Psalm 51', 'Matthew 18:21-35'],
      },
      {
        id: 'lp-temptation',
        title: 'And lead us not into temptation, but deliver us from evil',
        subtitle: 'The sixth petition',
        wsc: 106,
        verses: ['Matthew 26:41', '1 Corinthians 10:13'],
        requests: ['soul'],
        prompts: [
          'Ask God to keep you from being tempted to sin today, or to hold you up and deliver you when you are tempted. Name the temptations you know you will face.',
          'Pray for your own soul. Ask him to strengthen your faith and make you more like Christ in the places where you are weakest.',
          'Ask to be delivered from the evil one and from the evil in your own heart. God is faithful, and with every temptation he will provide the way of escape.',
        ],
        seeAlso: ['Ephesians 6:10-18', 'James 1:13-15'],
      },
      {
        id: 'lp-conclusion',
        title: 'For yours is the kingdom and the power and the glory, forever. Amen.',
        subtitle: 'The conclusion',
        wsc: 107,
        verses: ['Ephesians 3:20-21', '1 Samuel 7:12'],
        showAnswered: true,
        prompts: [
          'Take your encouragement in prayer from God alone. The kingdom and the power belong to him, so he is able to do all you have asked and far more.',
          'Give thanks for his mercies. Remember the prayers he has already answered, and set up another stone of help as Samuel did.',
          'End with praise, giving all the glory to him. Say Amen as a sign of your desire and of your assurance that he hears you.',
        ],
        seeAlso: ['1 Chronicles 29:10-13'],
      },
    ],
  },
  {
    id: 'acts',
    name: 'ACTS',
    short: 'Adoration, confession, thanksgiving, supplication',
    description: 'ACTS stands for Adoration, Confession, Thanksgiving, and Supplication. It is a simple order to remember, and it keeps praise and confession of sin in your prayers alongside your requests.',
    steps: [
      {
        id: 'acts-adoration',
        title: 'Adoration',
        subtitle: 'Praise God for who he is',
        wsc: 4,
        verses: ['Psalm 96:9', 'Revelation 4:11'],
        prompts: [
          'Begin with God himself before you bring any request. Praise him as the eternal God who never changes and who made all things for his glory.',
          'Choose one of his perfections, like his holiness or his steadfast love, and dwell on it for a minute. Tell him what his Word shows you of it, and let your heart answer with worship.',
          'Worship him also as your Redeemer. The God who made the heavens has loved you in Christ and made you his own.',
        ],
      },
      {
        id: 'acts-confession',
        title: 'Confession',
        subtitle: 'Agree with God about your sin',
        wsc: 87,
        verses: ['Psalm 139:23-24', '1 John 1:8-9', 'Psalm 103:10-12'],
        prompts: [
          'Ask God to search your heart by his Spirit. Confess the sins that come to mind and name them honestly, including the sins of the heart that no one else sees.',
          'Confess also the good you have left undone. Grieve over your sin, and turn from it to God with a full purpose to obey him.',
          'Now hear God’s promise of pardon. Christ has paid for your sins in full, so your forgiveness rests on his work and never on the strength of your repentance. For his sake God removes your transgressions as far as the east is from the west.',
        ],
      },
      {
        id: 'acts-thanksgiving',
        title: 'Thanksgiving',
        subtitle: 'Remember his mercies',
        wsc: 36,
        verses: ['Psalm 100:4-5', 'Ephesians 5:20'],
        showAnswered: true,
        prompts: [
          'Thank God for particular mercies. Think back over the past day and name the good gifts he has given you, great and small.',
          'Thank him above all for Christ and for the benefits that flow from him, like assurance of God’s love and peace of conscience.',
          'Remember the prayers he has answered. Each one is a stone of help, and with Samuel you can say, “Till now the LORD has helped us.”',
        ],
      },
      {
        id: 'acts-supplication',
        title: 'Supplication',
        subtitle: 'Bring your requests to God',
        wsc: 98,
        verses: ['Philippians 4:6-7', '1 John 5:14-15'],
        requests: 'all',
        prompts: [
          'Now bring your requests to God, for yourself and for others. Ask for things agreeable to his will, and ask in the name of Christ.',
          'Be specific and honest with him. He invites you to cast all your anxieties on him, because he cares for you.',
          'If something is on your heart that is not on the list, bring it anyway. Nothing that concerns you is too small for your Father’s care.',
        ],
      },
    ],
  },
  {
    id: 'henry',
    name: 'Matthew Henry’s Method',
    short: 'A fuller order in six parts',
    description: 'Matthew Henry was a Presbyterian pastor who wrote A Method for Prayer (1710) to help believers pray in the language of Scripture. This guide adapts the order of his main headings, beginning with adoration and ending with a conclusion of praise.',
    steps: [
      {
        id: 'henry-adoration',
        title: 'Adoration',
        subtitle: 'Address God and give him glory',
        wsc: 1,
        verses: ['Psalm 95:6-7', '1 Timothy 1:17'],
        prompts: [
          'Come before God with reverence, remembering that he is the King of the ages, the only God. Give him the honor that is due his name.',
          'You were made to glorify God and to enjoy him forever. Tell him that he is your chief joy and that you want to live for his glory.',
          'Confess your faith in the one God, Father, Son, and Holy Spirit, and give yourself to him afresh as his own.',
        ],
      },
      {
        id: 'henry-confession',
        title: 'Confession',
        subtitle: 'Humble yourself before him',
        wsc: 33,
        verses: ['Psalm 130:3-4', 'Psalm 51:10-12', 'Isaiah 1:18'],
        prompts: [
          'Humble yourself before God as a sinner. Confess the corruption of your nature as well as the particular sins of your life.',
          'Name the sins of this day or this week, and mourn over them before a holy God. Ask him to create in you a clean heart.',
          'Ask for pardon on the ground of Christ’s blood alone. God freely justifies the ungodly, and he accepts you as righteous only for the righteousness of Christ imputed to you and received by faith alone.',
        ],
      },
      {
        id: 'henry-petition',
        title: 'Petition for yourself',
        subtitle: 'Ask for the grace you need',
        wsc: 35,
        verses: ['Psalm 119:18', 'James 1:5'],
        requests: ['soul'],
        prompts: [
          'Ask first for the greatest things. Pray for more of the Spirit’s work in you and for a heart that loves God more than anything he gives.',
          'Ask for grace to die to sin and live to righteousness. Name the particular weakness you most need help with.',
          'Bring your needs of body and mind as well, like wisdom for a hard decision or strength for your work. Your Father cares about all of it.',
        ],
      },
      {
        id: 'henry-thanksgiving',
        title: 'Thanksgiving',
        subtitle: 'Give thanks for his mercies',
        verses: ['Psalm 107:1', 'James 1:17', '2 Corinthians 9:15'],
        showAnswered: true,
        prompts: [
          'Thank God for his mercies to you in body and soul. Every good gift comes down from the Father of lights.',
          'Give thanks for his inexpressible gift, the Lord Jesus Christ, and for all the benefits of redemption that come with him.',
          'Recall answers to prayer and thank him for each one. Set up your Ebenezer and remember how far the Lord has brought you.',
        ],
      },
      {
        id: 'henry-intercession',
        title: 'Intercession',
        subtitle: 'Pray for others',
        verses: ['1 Timothy 2:1-4', 'Ephesians 6:18'],
        requests: ['family', 'church', 'friends', 'lost', 'missions', 'persecuted', 'rulers', 'other', 'unassigned'],
        prompts: [
          'Pray for others as you would want them to pray for you. Scripture teaches you to pray for all kinds of people, from rulers and ministers to your own household.',
          'Pray for your family and your church by name. Ask God to grant repentance and faith to the lost and to sustain those who suffer for Christ.',
          'Remember your enemies too, and ask God to do them good. This is how Christ prayed for those who crucified him.',
        ],
        seeAlso: ['Luke 23:34', 'Matthew 5:44'],
      },
      {
        id: 'henry-conclusion',
        title: 'Conclusion',
        subtitle: 'Close with praise and faith',
        wsc: 107,
        verses: ['Psalm 115:1', 'Romans 11:33-36'],
        prompts: [
          'Gather up all your requests and ask God to hear them for Christ’s sake alone, since there is no worth in the prayers themselves.',
          'Ask him to forgive what was cold or careless in this prayer. Commit yourself and everything that concerns you to his care.',
          'Give the glory to God alone, and end with a heart that rests in his goodness.',
        ],
      },
    ],
  },
  {
    id: 'list',
    name: 'My List',
    short: 'Pray straight through today’s requests',
    description: 'Pray through the requests due today one at a time, for days when time is short or your mind needs a simple path. God hears the brief prayer of a tired child as surely as a long one.',
    steps: [
      {
        id: 'list-requests',
        title: 'Today’s requests',
        subtitle: 'Bring each one to your Father',
        verses: ['1 Peter 5:6-7'],
        requests: 'all',
        prompts: [
          'Take each request in turn. Speak to God about it simply, and ask in Christ’s name for what would honor him.',
          'When you have prayed for one, mark it and move to the next. Leave each burden with your Father, who cares for you.',
          'Even when time is short, thank him for one mercy from today and confess any sin that troubles your conscience, trusting Christ to cleanse it.',
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Learn essays.
// ---------------------------------------------------------------------------

export const TOPICS = [
  {
    id: 'sovereignty',
    title: 'Why pray if God is sovereign?',
    summary: 'God has ordained the prayers of his people as a means by which his purposes come to pass. So his sovereignty is a reason to pray and never a reason to stop.',
    body: [
      'If God has already decreed everything that will happen, why should you pray? It is an old question and an honest one. The Shorter Catechism teaches that God has foreordained whatsoever comes to pass (Q. 7). Yet the God who decreed the end also appointed the way to it. He has not only purposed to feed your family. He has also purposed that you work for your bread and ask him for it.',
      'Scripture shows this again and again. Daniel read in Jeremiah that the exile in Babylon would last seventy years. He did not sit back and wait for the date to arrive. He turned to the Lord in prayer, with fasting and pleas for mercy. Through Ezekiel God promised great blessings to Israel, and then he said he would let his people ask him for them. The promise did not make prayer needless. It made prayer hopeful.',
      'Prayer does not change God’s mind, and it does not tell him anything he does not already know. Your Father knows what you need before you ask him. Prayer is one of the means by which he gives what he has purposed to give. The Confession teaches that God in his ordinary providence makes use of means (WCF 5.3). The Shorter Catechism names prayer, together with the Word and sacraments, among the ordinary means of grace (Q. 88).',
      'This truth should make you bold instead of idle. If the outcome hung on the strength of your faith or the skill of your words, you would have good reason to fear. But the answer rests with a God who is wise and good, who works all things according to the counsel of his will. You may pour out your heart to him and leave the result in hands that never fail.',
      'God’s rule over all things also teaches you how to pray. Because he governs every creature and every action, nothing you ask is beyond his power. No hardened heart and no earthly king lies outside his reach. And because his will is always best, you learn to pray as your Savior did in the garden, “not my will, but yours, be done.” That is not a loss of nerve. It is the settled trust of a child in his Father.',
    ],
    verses: ['Isaiah 65:24', 'Matthew 7:7-8', 'Romans 11:33-36'],
    wsc: [7, 11, 88],
    wcf: ['21.3'],
    wlc: [178],
    seeAlso: ['Daniel 9:1-3', 'Ezekiel 36:37', 'James 4:2', 'Ephesians 1:11'],
  },
  {
    id: 'christ-name',
    title: 'Praying in the name of Christ',
    summary: 'To pray in Jesus’ name is to come to the Father trusting in Christ’s work and intercession alone. It is far more than adding a phrase to the end of a prayer.',
    body: [
      'Sin has put a great distance between us and God. By nature no sinner can stand in his holy presence. The Larger Catechism says our sinfulness is so great that we can have no access into his presence without a mediator (Q. 181). In mercy God has provided one. There is one mediator between God and men, the man Christ Jesus, and no saint or angel may stand in his place.',
      'To pray in Christ’s name is more than saying his name at the end of a prayer. The Larger Catechism says it means drawing our encouragement and boldness in prayer from Christ and his mediation (Q. 180). Our hope of being accepted comes from him too. You come because he commanded you to ask, and you lean on his promises as you ask. Whatever mercy you seek, you seek it for his sake and never on the ground of your own worth.',
      'This is good news for a weary believer. Your prayers are weak and mixed with sin. Your mind wanders, and you lose your place. Yet Christ is at the right hand of God, and he always lives to make intercession for those who draw near to God through him. He takes your poor requests and presents them to the Father, cleansed by his blood and made acceptable by his merit.',
      'Praying in Christ’s name also shapes what you ask. You cannot ask in his name for what would dishonor him, so his name is a guide as well as a warrant. When you ask for things agreeable to God’s will, for Christ’s sake, you may be sure you are heard. The Father delights to honor his Son, and he will not turn away anyone who comes clothed in his Son’s righteousness.',
      'The Confession teaches that prayer is to be made in the name of the Son and by the help of his Spirit (WCF 21.3). Worship belongs to the Father, the Son, and the Holy Spirit together, and to God alone (WCF 21.2). The ordinary pattern of Scripture is to come to the Father through the Son by the help of the Spirit. When you feel least worthy to pray, remember that you were never meant to come on your own worth. You come in the name of the one the Father always hears.',
    ],
    verses: ['1 Timothy 2:5', 'Hebrews 7:25', 'John 16:23-24'],
    wsc: [25, 98],
    wcf: ['21.2', '21.3'],
    wlc: [180, 181],
    seeAlso: ['Ephesians 2:18', 'Romans 5:1-2', 'Hebrews 9:24'],
  },
  {
    id: 'spirit',
    title: 'The help of the Spirit',
    summary: 'You do not know how to pray as you ought. But the Holy Spirit helps you in your weakness and works in you the desires God delights to answer.',
    body: [
      'Prayer is hard work for a sinner. You kneel to pray and find your heart cold and your thoughts scattered. Sometimes you do not even know what to ask. The apostle Paul knew this struggle. He wrote that we do not know what to pray for as we ought. But he did not leave it there. He added that the Spirit himself helps us in our weakness and intercedes for the saints according to the will of God.',
      'The Larger Catechism explains how the Spirit helps (Q. 182). He enables us to understand for whom and what and how we should pray. He also works in our hearts the desires and graces that true prayer needs. He does not do this in the same measure in every person or at every time. Some days your prayers will feel full and warm, and other days they will feel thin. The Spirit is at work in both.',
      'The Spirit does not bring new revelations in prayer. He works through the Word he has already given. He opens your eyes to see wonderful things in God’s law and brings his promises to mind when you need them. The Shorter Catechism teaches that the Spirit makes the reading and preaching of the Word effectual (Q. 89). That is why Bible reading and prayer belong together. The Spirit who inspired the Scriptures teaches you to pray them back to God.',
      'Christ has promised that your heavenly Father will give the Holy Spirit to those who ask him. So when your heart is dull, ask for the Spirit’s help. Confess your coldness honestly, and do not wait until you feel ready before you begin. Often the warmth comes while you are praying. Keep coming, and trust that the Spirit is helping you even when you cannot feel it.',
      'The Spirit’s help is a great comfort when words fail. In grief or deep trouble you may be able to do little more than sigh before God. Scripture says the Spirit intercedes for us with groanings too deep for words. The Father who searches hearts knows the mind of the Spirit. Your sighs are not wasted. They are heard in heaven as prayer.',
    ],
    verses: ['Romans 8:26-27', 'Luke 11:9-13', 'Ephesians 6:18'],
    wsc: [89],
    wcf: ['21.3'],
    wlc: [182],
    seeAlso: ['Zechariah 12:10', 'Galatians 4:6', 'Jude 20-21'],
  },
  {
    id: 'scripture',
    title: 'Praying the Scriptures and the Psalms',
    summary: 'The whole Word of God directs you in prayer, and the Psalms give you words the Spirit himself inspired for every condition of the soul.',
    body: [
      'The Shorter Catechism teaches that the whole Word of God is of use to direct us in prayer (Q. 99). God has not left you to invent your prayers from nothing. He has given you promises to plead and commands to ask grace for. His Word also holds many prayers of his saints for you to learn from. When you pray Scripture, you ask for what God has already said he is pleased to give.',
      'Praying Scripture is simple. Read a passage slowly, and let each part become prayer. When the text shows you something of God, stop and praise him for it. When it gives a command or a promise, turn it into a request. Ask him to give what he commands and to do what he has said. Read each promise in its setting, so that you plead what God has actually said. The passage keeps your prayer anchored and gives a wandering mind a path to follow.',
      'The Psalms deserve a special place. They are the prayer book and song book God gave his church. Every condition of the soul is found in them, from joy and thanksgiving to guilt and dark discouragement. Our Lord prayed the Psalms, even on the cross. The church in Jerusalem prayed the second psalm when the apostles were threatened. When you do not know what to say, open the Psalter and borrow the words the Spirit has given.',
      'This app suggests five psalms for each day of the month, so you can pray through the whole Psalter every month. You need not read them all at one sitting. Take one psalm with you into your prayer. Notice what it says about God and what it asks of him, and make its words your own. The Confession counts the singing of psalms with grace in the heart as part of God’s worship (WCF 21.5). Singing them at home also fixes them in your memory.',
      'The Lord’s Prayer is the special rule of direction in prayer. The Larger Catechism says it is a pattern for our other prayers. It may also be prayed itself, as long as we pray it with understanding and faith (Q. 187). Pray it slowly, and use its petitions as headings for your own requests. Over time the words of Christ will train your desires until you ask as he taught.',
    ],
    verses: ['John 15:7', 'Psalm 119:18', 'Psalm 62:8'],
    wsc: [99],
    wcf: ['21.3', '21.5'],
    wlc: [186, 187],
    seeAlso: ['Colossians 3:16', 'Acts 4:23-31', 'Matthew 27:46'],
  },
  {
    id: 'lords-day',
    title: 'The Lord’s Day and prayer',
    summary: 'God has set apart one day in seven for rest and worship. The Lord’s Day is his weekly gift of time to pray with his people and in your home.',
    body: [
      'From the beginning God set apart one day in seven to be kept holy to himself. Since the resurrection of Christ, that day is the first day of the week. Scripture calls it the Lord’s Day, and the Confession calls it the Christian Sabbath (WCF 21.7). It is a day of holy rest and worship. God does not give it to you as a burden. He gives it as a Father who knows you need rest, and who knows even better that you need him.',
      'The Confession teaches that keeping the Sabbath holy starts with preparing our hearts and ordering our common affairs beforehand (WCF 21.8). So preparation begins on Saturday. Finish what work and errands you can, and set out what the family will need for the morning. Then on Saturday evening pray for your minister as he prepares to preach, and ask God to make your own heart ready to hear.',
      'On the Lord’s Day itself, public worship comes first. There you pray with the whole congregation as the minister leads. Join your heart to his words and say your own quiet amen. The Confession calls us to rest all day from our worldly work and recreations, even in our words and thoughts. It calls us to spend the whole time in the public and private exercises of God’s worship. Duties of necessity and mercy belong to the day as well (WCF 21.8). No other day of the week gives you so much room for prayer.',
      'The hours at home between services are a good time for family worship and for secret prayer. Talk with your household about the sermon and pray over what you heard. Pray by name for members of your church who are sick or shut in. If you have more time than usual, pray through a longer psalm or take the fuller Henry method in this app. Rest in God’s presence without hurrying.',
      'If your work or circumstances make the day hard to keep, do not despair. Some callings rightly require works of necessity and mercy, and some believers are kept home by illness or by caring for a little one. God knows your frame. If your job presses you into ordinary work on his day, ask him for wisdom and courage to seek a way to keep it. Do what you can to keep the day holy. Ask him to bring you back to his house and to fill the day with his presence wherever you are.',
    ],
    verses: ['Exodus 20:8', 'Isaiah 58:13-14', 'Hebrews 10:24-25'],
    wsc: [58, 59, 60],
    wcf: ['21.7', '21.8'],
    seeAlso: ['Genesis 2:2-3', 'Mark 2:27-28', 'Acts 20:7', 'Revelation 1:10'],
  },
  {
    id: 'family',
    title: 'Family worship and praying with your household',
    summary: 'God calls households to worship him every day, and even a short time around his Word and in prayer can shape a family for generations.',
    body: [
      'The Confession says God is to be worshipped in private families daily (WCF 21.6). Your home is a little church. Joshua resolved that he and his house would serve the Lord. Moses told parents to talk of God’s words when they sat in the house and when they walked by the way. God gives children to his people within his covenant, and the promise is to you and to your children.',
      'Family worship does not need to be long or polished. Many Reformed households read a short passage of Scripture with a word of explanation and then pray together. Some also sing a psalm, and children often learn the psalms more quickly than their parents. Ten or fifteen minutes is enough for most homes, especially with little ones. What matters most is that you keep at it day after day with a warm heart.',
      'When you lead your family in prayer, use plain words your children can follow. Thank God for particular mercies of the day, and confess sin honestly, including your own. Pray for each child by name. Pray also for your church and for neighbors who do not yet know Christ. Let your children hear you pray, and in time invite them to pray too. Husbands and wives should also pray together, even briefly at the end of the day.',
      'Pray for your children with covenant hope. They are not outsiders to be won by clever methods. They belong to the visible church and bear the sign of God’s promise in their baptism. Yet each one needs the new birth that only the Spirit can give. He works it in his own time and often out of sight. So ask God to do in them what you cannot do. Ask him to grant them repentance and faith, and to bring them to rest on Christ alone.',
      'Some evenings will go poorly. The little one cries through the reading, and you are worn out from a long shift. Keep going anyway, because your faithfulness is not measured by one night. Over the years a household that bows before God each day learns that he is real and near. Children who grew up hearing a father or mother pray often remember it long after they have left home.',
    ],
    verses: ['Deuteronomy 6:6-7', 'Joshua 24:15', 'Acts 2:39'],
    wsc: [88, 95],
    wcf: ['21.6'],
    wlc: [183],
    seeAlso: ['Genesis 18:19', 'Psalm 78:1-7', 'Ephesians 6:4', '1 Peter 3:7'],
  },
  {
    id: 'unanswered',
    title: 'When the answer is no or not yet',
    summary: 'God hears every prayer offered in Christ’s name. When he withholds or delays what you ask, he is giving you something wiser from a Father’s hand.',
    body: [
      'Every Christian knows the ache of prayer that seems unanswered. You may have prayed for years for a wayward son or for healing that has not come, and heaven seems silent. Scripture does not hide this experience. The psalmists asked God how long they must wait. Paul pleaded with the Lord three times to take away his thorn in the flesh, and the thorn remained. Many saints have waited before you.',
      'God hears every prayer made in the name of Christ. The promise that he hears us when we ask according to his will is sure. But hearing a prayer is not the same as granting it in the form we asked. A wise father does not give his child everything the child asks for. Because God is good, he sometimes says no. And because he is wise, he often says not yet.',
      'When God said no to Paul, he gave him something better. He said, “My grace is sufficient for you, for my power is made perfect in weakness.” The thorn stayed, and the power of Christ rested on Paul in his weakness. God may leave your burden in place for a time so that you will learn to lean on him. What he withholds with one hand he often gives back with the other in grace.',
      'Unanswered prayer can also be a call to examine your heart. Scripture warns that we sometimes ask wrongly, wanting to spend what we receive on our own pleasures. Ask God to search you and purify your desires. Yet do not assume that delay always means hidden sin. Job was a righteous man and still suffered long. Often God is simply teaching you to wait, and waiting on him is part of faith.',
      'So keep praying. Christ told his disciples a parable to show that they ought always to pray and not lose heart. The Larger Catechism says we are to pray with perseverance, waiting upon God with humble submission to his will (Q. 185). Bring the same request again tomorrow, and leave the time and manner of the answer to him. One day you will see that he has done all things well.',
    ],
    verses: ['2 Corinthians 12:8-9', 'Matthew 7:11', 'Luke 18:1'],
    wsc: [98, 103],
    wcf: ['21.3'],
    wlc: [185],
    seeAlso: ['Psalm 13', 'Luke 18:1-8', 'James 4:3', 'Romans 8:28'],
  },
  {
    id: 'confession',
    title: 'Confession and assurance of pardon',
    summary: 'Honest confession of sin brings you to a Father who has promised to forgive everyone who comes to him through Christ.',
    body: [
      'The Shorter Catechism puts confession of our sins into its very definition of prayer (Q. 98). This is not because God needs to be told what we have done, since he knows it all already. We confess because agreeing honestly with God about our sin is part of turning from it. David kept silent for a time and felt God’s hand heavy upon him. When he acknowledged his sin, God forgave the iniquity of his sin.',
      'Confess specifically. It is easy to ask God to forgive all your sins and then move quickly on. It is better to name what you actually did, like the harsh word you spoke at home or the hours you wasted. Name the sins of omission too, such as the prayer you neglected or the kindness you withheld. Ask God to search your heart by his Spirit and show you what you cannot see on your own.',
      'Confess with sorrow, but never with despair. Repentance unto life is a saving grace. It flows from a true sense of your sin together with an apprehension of the mercy of God in Christ (Q. 87). Both must be present. A sense of sin without a sight of mercy leads to hopelessness, and a hope of mercy without a sense of sin becomes presumption. Look honestly at your sin, and then look longer at the cross.',
      'Then receive the assurance of pardon. “If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.” God’s forgiveness rests on his faithfulness and justice because Christ has already borne the penalty in full. Justification is an act of God’s free grace, in which he pardons all our sins. He accepts us as righteous only for the righteousness of Christ, imputed to us and received by faith alone (Q. 33). Because you are in Christ Jesus, no condemnation is left for you.',
      'The fifth petition teaches that God’s forgiveness makes us forgiving. As you receive mercy, show it to those who have wronged you. Holding a grudge while asking for pardon is a contradiction you should not live with. The Shorter Catechism says we are encouraged to ask for pardon because God’s grace enables us to forgive others from the heart (Q. 105). Let the mercy you have received flow out to others.',
    ],
    verses: ['Psalm 32:5', '1 John 1:8-9', 'Micah 7:18-19', 'Romans 8:1'],
    wsc: [33, 87, 98, 105],
    wcf: ['21.3'],
    wlc: [194],
    seeAlso: ['Psalm 51', 'Luke 15:11-24', 'Isaiah 53:4-6'],
  },
  {
    id: 'kingdom',
    title: 'Praying for the kingdom',
    summary: 'When you pray “Your kingdom come,” you ask God to advance the kingdom of grace through the gospel. You also ask him to hasten the day when Christ returns in glory.',
    body: [
      'When you pray “Your kingdom come,” you are asking for something far larger than your own affairs. You are asking God to push back the kingdom of darkness and to make the rule of Christ known and loved across the earth. The Shorter Catechism teaches that in this petition we pray that Satan’s kingdom may be destroyed (Q. 102). Christ is already king, and he conquers his enemies and ours as the gospel goes out.',
      'We also pray that the kingdom of grace may be advanced. This is Christ’s saving rule in the hearts of his people. It grows wherever the gospel is preached and sinners are brought to faith. So pray for missionaries and for faithful preaching in your own church. As the catechism puts it, ask that you and others would be brought into this kingdom and kept in it. Ask God to give new hearts to those you love who are still outside.',
      'We pray as well that the kingdom of glory may be hastened. This is the full and final reign of Christ that will be revealed when he returns. On that day every enemy will be under his feet, and his people will be with him forever. So the church has always prayed, “Come, Lord Jesus!” Christ will come at the time the Father has fixed, and no one knows the day or the hour. Our part is to long for it and to be ready.',
      'Christians who hold the Westminster Standards have differed over how widely the gospel will prosper before Christ returns. Some expect the knowledge of the Lord to fill the earth before the end. Others expect the church to remain a pilgrim people, growing through the gospel while bearing the cross, until that day. Both can pray this petition with one heart, longing for the nations to be discipled and for Christ to come again. Pray boldly for the spread of the gospel, and leave the measure of its success to God.',
      'This petition also reaches into your own heart and home. Christ rules his people by his Word and Spirit. When you pray for his kingdom to come, you ask him to rule more fully in you. He is also King over the nations. Scripture calls the rulers of the earth to serve the Lord with fear and to honor his Son. Pray that the nations and their leaders would bow to Christ and find their blessing in him.',
    ],
    verses: ['Habakkuk 2:14', 'Psalm 2:8', 'Revelation 22:20'],
    wsc: [26, 102],
    wcf: ['21.4'],
    wlc: [191],
    seeAlso: ['Matthew 28:18-20', 'Matthew 13:31-33', 'Romans 11:25-26', '1 Corinthians 15:24-28', 'Psalm 2:10-12'],
  },
  {
    id: 'secret',
    title: 'Secret prayer',
    summary: 'Christ calls you to meet with your Father alone, and the hidden time of prayer is where the life of your soul is fed.',
    body: [
      'The Confession teaches that God is to be worshipped daily in families and also in secret, each one by himself (WCF 21.6). Public worship and family worship are precious, but they do not replace time alone with God. Christ told his disciples to go into their room and shut the door, and there to pray to their Father who is in secret. He promised that the Father who sees in secret will reward them.',
      'Our Lord kept this practice himself. Very early in the morning, while it was still dark, he went out to a desolate place to pray. Daniel knelt three times a day with his windows open toward Jerusalem, even when his prayers could cost him his life. If the Son of God made time to be alone with his Father, you and I need that time far more.',
      'Secret prayer does not require a special room or a long hour. It requires a set time and a place where you can be honest before God. For some that is the truck cab before the shift begins. For others it is a quiet kitchen before the house wakes up. Choose a time you can actually keep, and guard it the way you would guard any appointment that matters to you.',
      'Alone with God you can say what you would never say before others. You can confess the sins no one else knows and bring out fears you have hidden even from your family. The psalmist urges God’s people to pour out their hearts before him, for he is a refuge. There is no need to perform. Your Father sees in secret, and because you come in Christ’s name, nothing he sees there will make him turn you away.',
      'When you struggle to focus, do not give up. Pray aloud in a low voice, or write your prayers down. Use a psalm or the Lord’s Prayer as a guide, and keep a short list of requests so your mind has a path to follow. The time will not always feel sweet. Yet God uses the habit of meeting him in secret to shape you over the years in ways you cannot yet see.',
    ],
    verses: ['Matthew 6:6', 'Mark 1:35', 'Daniel 6:10'],
    wsc: [88, 98],
    wcf: ['21.6'],
    seeAlso: ['Psalm 62:5-8', 'Luke 5:16', 'Matthew 14:23'],
  },
];

// ---------------------------------------------------------------------------
// Helpers (pure).
// ---------------------------------------------------------------------------

/** Returns the method with this id, or the Lord's Prayer method. */
export function getMethod(id) {
  return METHODS.find((m) => m.id === id) || METHODS[0];
}

/** Returns the Learn topic with this id, or null. */
export function getTopic(id) {
  return TOPICS.find((t) => t.id === id) || null;
}

/**
 * The benediction ref for a given local date, cycling through BENEDICTIONS one
 * per day. Uses local calendar fields so every hour of a day gives the same ref.
 */
export function benedictionForDay(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const dayNumber = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const i = ((dayNumber % BENEDICTIONS.length) + BENEDICTIONS.length) % BENEDICTIONS.length;
  return BENEDICTIONS[i];
}

// Pseudo ids a step's `requests` array may hold besides real category ids.
const PSEUDO_IDS = new Set(['all', 'unassigned']);

function findOwningMethod(step, method) {
  if (method && typeof method === 'object' && Array.isArray(method.steps)) return method;
  if (typeof method === 'string') return METHODS.find((m) => m.id === method) || null;
  return (
    METHODS.find((m) => m.steps.includes(step)) ||
    (step && step.id ? METHODS.find((m) => m.steps.some((s) => s.id === step.id)) : null) ||
    null
  );
}

function sortByCategoryOrder(list, categories) {
  if (!Array.isArray(categories) || categories.length === 0) return list;
  const rank = new Map();
  categories.forEach((c, i) => {
    if (c && c.id != null) rank.set(c.id, typeof c.order === 'number' && Number.isFinite(c.order) ? c.order : i);
  });
  return list
    .map((r, i) => ({ r, i, k: rank.has(r.categoryId) ? rank.get(r.categoryId) : Infinity }))
    .sort((a, b) => (a.k === b.k ? a.i - b.i : a.k < b.k ? -1 : 1))
    .map((x) => x.r);
}

/**
 * Which of `requests` belong on `step`. Pure: returns a new array and never
 * mutates its inputs.
 *
 * step.requests may be:
 *   'all'           every request
 *   'unassigned'    requests whose category is not claimed by any step of the
 *                   method (user-made categories, unknown ids)
 *   [ids]           requests in those categories; the array may also contain
 *                   'unassigned' to take the unclaimed ones as well
 *   missing         no requests
 *
 * The owning method is found from METHODS (by identity, then by step id,
 * which is unique across methods). Pass `method` (object or id) to override.
 * Results keep the input order within a category and are ordered by
 * `categories` (by `order`, else array position); unknown categories go last.
 */
export function assignRequestsToStep(step, requests, categories, method) {
  if (!step || !Array.isArray(requests)) return [];
  const spec = step.requests;
  const list = requests.filter((r) => r && typeof r === 'object');
  let picked;
  if (spec === 'all') {
    picked = list;
  } else {
    const wanted = spec === 'unassigned' ? ['unassigned'] : Array.isArray(spec) ? spec : [];
    if (wanted.includes('all')) {
      picked = list;
    } else {
      const explicit = new Set(wanted.filter((id) => !PSEUDO_IDS.has(id)));
      const takesUnassigned = wanted.includes('unassigned');
      const claimed = new Set(explicit);
      if (takesUnassigned) {
        const owner = findOwningMethod(step, method);
        if (owner) {
          for (const s of owner.steps) {
            if (Array.isArray(s.requests)) {
              for (const id of s.requests) if (!PSEUDO_IDS.has(id)) claimed.add(id);
            }
          }
        }
      }
      picked = list.filter((r) => explicit.has(r.categoryId) || (takesUnassigned && !claimed.has(r.categoryId)));
    }
  }
  return sortByCategoryOrder(picked.slice(), categories);
}
