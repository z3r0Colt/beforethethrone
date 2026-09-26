// Scripture quoted in Before the Throne.
//
// Every text below is the ESV (2016 permanent text) exactly as printed on
// esv.org: same words, capitals (LORD), curly quotation marks, apostrophes and
// em dashes. Verse numbers, headings, psalm superscriptions and footnote
// markers are left out. A passage that spans several verses or poetic lines is
// joined into one string with single spaces. A passage that starts or ends in
// the middle of a sentence or quotation keeps the punctuation ESV prints there.
//
// Crossway permits quoting up to 500 verses without written permission. The
// app quotes ONLY the passages in this file (longer readings are linked to
// esv.org instead), and the unit tests keep the total of countVerses() under
// 500.
//
// Data modules import nothing, so this file can be loaded and tested on its own.

export const ESV_NOTICE = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';

const v = (ref, tags, text) => ({ ref, text, tags });

export const VERSES = [
  // ---- Approach and promises ----
  v('Hebrews 4:16', ['daily', 'approach'],
    'Let us then with confidence draw near to the throne of grace, that we may receive mercy and find grace to help in time of need.'),
  v('Hebrews 10:19-22', ['approach'],
    'Therefore, brothers, since we have confidence to enter the holy places by the blood of Jesus, by the new and living way that he opened for us through the curtain, that is, through his flesh, and since we have a great priest over the house of God, let us draw near with a true heart in full assurance of faith, with our hearts sprinkled clean from an evil conscience and our bodies washed with pure water.'),
  v('Philippians 4:6-7', ['daily', 'approach'],
    'do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.'),
  v('1 Thessalonians 5:16-18', ['daily', 'approach'],
    'Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you.'),
  v('Matthew 7:7-8', ['daily', 'approach'],
    '“Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you. For everyone who asks receives, and the one who seeks finds, and to the one who knocks it will be opened.'),
  v('Matthew 7:11', ['daily', 'approach'],
    'If you then, who are evil, know how to give good gifts to your children, how much more will your Father who is in heaven give good things to those who ask him!'),
  v('James 5:16', ['daily', 'approach'],
    'Therefore, confess your sins to one another and pray for one another, that you may be healed. The prayer of a righteous person has great power as it is working.'),
  v('1 John 5:14-15', ['daily', 'approach'],
    'And this is the confidence that we have toward him, that if we ask anything according to his will he hears us. And if we know that he hears us in whatever we ask, we know that we have the requests that we have asked of him.'),
  v('Romans 8:26-27', ['daily', 'spirit', 'approach'],
    'Likewise the Spirit helps us in our weakness. For we do not know what to pray for as we ought, but the Spirit himself intercedes for us with groanings too deep for words. And he who searches hearts knows what is the mind of the Spirit, because the Spirit intercedes for the saints according to the will of God.'),
  v('Romans 8:34', ['daily', 'christ', 'approach'],
    'Who is to condemn? Christ Jesus is the one who died—more than that, who was raised—who is at the right hand of God, who indeed is interceding for us.'),
  v('Hebrews 7:25', ['daily', 'christ', 'approach'],
    'Consequently, he is able to save to the uttermost those who draw near to God through him, since he always lives to make intercession for them.'),
  v('1 Timothy 2:5', ['christ', 'approach'],
    'For there is one God, and there is one mediator between God and men, the man Christ Jesus,'),
  v('John 14:13-14', ['daily', 'christ', 'approach'],
    'Whatever you ask in my name, this I will do, that the Father may be glorified in the Son. If you ask me anything in my name, I will do it.'),
  v('John 16:23-24', ['daily', 'christ', 'approach'],
    'In that day you will ask nothing of me. Truly, truly, I say to you, whatever you ask of the Father in my name, he will give it to you. Until now you have asked nothing in my name. Ask, and you will receive, that your joy may be full.'),
  v('John 15:7', ['daily', 'approach'],
    'If you abide in me, and my words abide in you, ask whatever you wish, and it will be done for you.'),
  v('Matthew 6:6', ['daily', 'secret', 'approach'],
    'But when you pray, go into your room and shut the door and pray to your Father who is in secret. And your Father who sees in secret will reward you.'),
  v('Matthew 6:9-13', ['lordsprayer', 'approach'],
    'Pray then like this: “Our Father in heaven, hallowed be your name. Your kingdom come, your will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our debts, as we also have forgiven our debtors. And lead us not into temptation, but deliver us from evil.'),
  v('Luke 11:1', ['daily', 'approach'],
    'Now Jesus was praying in a certain place, and when he finished, one of his disciples said to him, “Lord, teach us to pray, as John taught his disciples.”'),
  v('Luke 11:9-13', ['daily', 'spirit', 'approach'],
    'And I tell you, ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you. For everyone who asks receives, and the one who seeks finds, and to the one who knocks it will be opened. What father among you, if his son asks for a fish, will instead of a fish give him a serpent; or if he asks for an egg, will give him a scorpion? If you then, who are evil, know how to give good gifts to your children, how much more will the heavenly Father give the Holy Spirit to those who ask him!”'),
  v('Luke 18:1', ['daily', 'approach'],
    'And he told them a parable to the effect that they ought always to pray and not lose heart.'),
  v('Colossians 4:2', ['daily', 'approach'],
    'Continue steadfastly in prayer, being watchful in it with thanksgiving.'),
  v('Ephesians 6:18', ['daily', 'approach'],
    'praying at all times in the Spirit, with all prayer and supplication. To that end, keep alert with all perseverance, making supplication for all the saints,'),
  v('Romans 12:12', ['daily', 'approach'],
    'Rejoice in hope, be patient in tribulation, be constant in prayer.'),
  v('1 Peter 5:6-7', ['daily', 'approach'],
    'Humble yourselves, therefore, under the mighty hand of God so that at the proper time he may exalt you, casting all your anxieties on him, because he cares for you.'),
  v('Psalm 145:18', ['daily', 'approach'],
    'The LORD is near to all who call on him, to all who call on him in truth.'),
  v('Psalm 62:8', ['daily', 'approach'],
    'Trust in him at all times, O people; pour out your heart before him; God is a refuge for us. Selah'),
  v('Psalm 5:3', ['daily', 'morning', 'approach'],
    'O LORD, in the morning you hear my voice; in the morning I prepare a sacrifice for you and watch.'),
  v('Psalm 55:17', ['daily', 'approach'],
    'Evening and morning and at noon I utter my complaint and moan, and he hears my voice.'),
  v('Psalm 116:1-2', ['daily', 'approach'],
    'I love the LORD, because he has heard my voice and my pleas for mercy. Because he inclined his ear to me, therefore I will call on him as long as I live.'),
  v('Psalm 34:15', ['daily', 'approach'],
    'The eyes of the LORD are toward the righteous and his ears toward their cry.'),
  v('Psalm 50:15', ['daily', 'approach'],
    'and call upon me in the day of trouble; I will deliver you, and you shall glorify me.”'),
  v('Psalm 65:2', ['daily', 'approach'],
    'O you who hear prayer, to you shall all flesh come.'),
  v('Psalm 141:2', ['daily', 'evening', 'approach'],
    'Let my prayer be counted as incense before you, and the lifting up of my hands as the evening sacrifice!'),
  v('Psalm 27:4', ['daily', 'approach'],
    'One thing have I asked of the LORD, that will I seek after: that I may dwell in the house of the LORD all the days of my life, to gaze upon the beauty of the LORD and to inquire in his temple.'),
  v('Psalm 27:8', ['daily', 'approach'],
    'You have said, “Seek my face.” My heart says to you, “Your face, LORD, do I seek.”'),
  v('Psalm 42:1-2', ['daily', 'approach'],
    'As a deer pants for flowing streams, so pants my soul for you, O God. My soul thirsts for God, for the living God. When shall I come and appear before God?'),
  v('Psalm 63:1', ['daily', 'approach'],
    'O God, you are my God; earnestly I seek you; my soul thirsts for you; my flesh faints for you, as in a dry and weary land where there is no water.'),
  v('Psalm 73:25-26', ['daily', 'approach'],
    'Whom have I in heaven but you? And there is nothing on earth that I desire besides you. My flesh and my heart may fail, but God is the strength of my heart and my portion forever.'),
  v('Psalm 86:5', ['daily', 'approach'],
    'For you, O Lord, are good and forgiving, abounding in steadfast love to all who call upon you.'),
  v('Psalm 90:12', ['daily', 'approach'],
    'So teach us to number our days that we may get a heart of wisdom.'),
  v('Psalm 90:14', ['daily', 'morning', 'approach'],
    'Satisfy us in the morning with your steadfast love, that we may rejoice and be glad all our days.'),
  v('Psalm 115:1', ['daily', 'adoration', 'approach'],
    'Not to us, O LORD, not to us, but to your name give glory, for the sake of your steadfast love and your faithfulness!'),
  v('Psalm 121:1-2', ['daily', 'approach'],
    'I lift up my eyes to the hills. From where does my help come? My help comes from the LORD, who made heaven and earth.'),
  v('Psalm 130:3-4', ['daily', 'confession', 'approach'],
    'If you, O LORD, should mark iniquities, O Lord, who could stand? But with you there is forgiveness, that you may be feared.'),
  v('Psalm 143:8', ['daily', 'morning', 'approach'],
    'Let me hear in the morning of your steadfast love, for in you I trust. Make me know the way I should go, for to you I lift up my soul.'),
  v('Psalm 19:14', ['daily', 'approach'],
    'Let the words of my mouth and the meditation of my heart be acceptable in your sight, O LORD, my rock and my redeemer.'),
  v('Psalm 46:1', ['daily', 'approach'],
    'God is our refuge and strength, a very present help in trouble.'),
  v('Psalm 46:10', ['daily', 'approach'],
    '“Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!”'),
  v('Psalm 16:11', ['daily', 'approach'],
    'You make known to me the path of life; in your presence there is fullness of joy; at your right hand are pleasures forevermore.'),
  v('Isaiah 55:6-7', ['daily', 'approach'],
    '“Seek the LORD while he may be found; call upon him while he is near; let the wicked forsake his way, and the unrighteous man his thoughts; let him return to the LORD, that he may have compassion on him, and to our God, for he will abundantly pardon.'),
  v('Isaiah 57:15', ['daily', 'approach'],
    'For thus says the One who is high and lifted up, who inhabits eternity, whose name is Holy: “I dwell in the high and holy place, and also with him who is of a contrite and lowly spirit, to revive the spirit of the lowly, and to revive the heart of the contrite.'),
  v('Isaiah 65:24', ['daily', 'approach'],
    'Before they call I will answer; while they are yet speaking I will hear.'),
  v('Isaiah 40:31', ['daily', 'approach'],
    'but they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.'),
  v('Jeremiah 33:3', ['daily', 'approach'],
    'Call to me and I will answer you, and will tell you great and hidden things that you have not known.'),
  v('Lamentations 3:22-23', ['daily', 'morning', 'approach'],
    'The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.'),
  v('Daniel 6:10', ['daily', 'approach'],
    'When Daniel knew that the document had been signed, he went to his house where he had windows in his upper chamber open toward Jerusalem. He got down on his knees three times a day and prayed and gave thanks before his God, as he had done previously.'),
  v('Mark 1:35', ['daily', 'morning', 'approach'],
    'And rising very early in the morning, while it was still dark, he departed and went out to a desolate place, and there he prayed.'),
  v('Proverbs 15:8', ['daily', 'approach'],
    'The sacrifice of the wicked is an abomination to the LORD, but the prayer of the upright is acceptable to him.'),
  v('Revelation 5:8', ['daily', 'approach'],
    'And when he had taken the scroll, the four living creatures and the twenty-four elders fell down before the Lamb, each holding a harp, and golden bowls full of incense, which are the prayers of the saints.'),
  v('Ephesians 3:20-21', ['daily', 'doxology', 'approach'],
    'Now to him who is able to do far more abundantly than all that we ask or think, according to the power at work within us, to him be glory in the church and in Christ Jesus throughout all generations, forever and ever. Amen.'),
  v('Romans 15:13', ['benediction', 'approach'],
    'May the God of hope fill you with all joy and peace in believing, so that by the power of the Holy Spirit you may abound in hope.'),

  // ---- Adoration ----
  v('Psalm 145:3', ['adoration'],
    'Great is the LORD, and greatly to be praised, and his greatness is unsearchable.'),
  v('Psalm 96:9', ['adoration'],
    'Worship the LORD in the splendor of holiness; tremble before him, all the earth!'),
  v('Isaiah 6:3', ['adoration'],
    'And one called to another and said: “Holy, holy, holy is the LORD of hosts; the whole earth is full of his glory!”'),
  v('Revelation 4:11', ['adoration'],
    '“Worthy are you, our Lord and God, to receive glory and honor and power, for you created all things, and by your will they existed and were created.”'),
  v('Psalm 103:1-5', ['adoration'],
    'Bless the LORD, O my soul, and all that is within me, bless his holy name! Bless the LORD, O my soul, and forget not all his benefits, who forgives all your iniquity, who heals all your diseases, who redeems your life from the pit, who crowns you with steadfast love and mercy, who satisfies you with good so that your youth is renewed like the eagle’s.'),
  v('Romans 11:33-36', ['adoration'],
    'Oh, the depth of the riches and wisdom and knowledge of God! How unsearchable are his judgments and how inscrutable his ways! “For who has known the mind of the Lord, or who has been his counselor?” “Or who has given a gift to him that he might be repaid?” For from him and through him and to him are all things. To him be glory forever. Amen.'),
  v('1 Timothy 1:17', ['adoration'],
    'To the King of the ages, immortal, invisible, the only God, be honor and glory forever and ever. Amen.'),
  v('Psalm 95:6-7', ['adoration'],
    'Oh come, let us worship and bow down; let us kneel before the LORD, our Maker! For he is our God, and we are the people of his pasture, and the sheep of his hand. Today, if you hear his voice,'),
  v('Psalm 72:18-19', ['kingdom', 'adoration'],
    'Blessed be the LORD, the God of Israel, who alone does wondrous things. Blessed be his glorious name forever; may the whole earth be filled with his glory! Amen and Amen!'),

  // ---- Confession and pardon ----
  v('1 John 1:8-9', ['confession'],
    'If we say we have no sin, we deceive ourselves, and the truth is not in us. If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.'),
  v('Psalm 51:10-12', ['confession'],
    'Create in me a clean heart, O God, and renew a right spirit within me. Cast me not away from your presence, and take not your Holy Spirit from me. Restore to me the joy of your salvation, and uphold me with a willing spirit.'),
  v('Psalm 32:5', ['confession'],
    'I acknowledged my sin to you, and I did not cover my iniquity; I said, “I will confess my transgressions to the LORD,” and you forgave the iniquity of my sin. Selah'),
  v('Psalm 139:23-24', ['confession'],
    'Search me, O God, and know my heart! Try me and know my thoughts! And see if there be any grievous way in me, and lead me in the way everlasting!'),
  v('Proverbs 28:13', ['confession'],
    'Whoever conceals his transgressions will not prosper, but he who confesses and forsakes them will obtain mercy.'),
  v('Isaiah 1:18', ['confession'],
    '“Come now, let us reason together, says the LORD: though your sins are like scarlet, they shall be as white as snow; though they are red like crimson, they shall become like wool.'),
  v('Romans 8:1', ['confession'],
    'There is therefore now no condemnation for those who are in Christ Jesus.'),
  v('Micah 7:18-19', ['confession'],
    'Who is a God like you, pardoning iniquity and passing over transgression for the remnant of his inheritance? He does not retain his anger forever, because he delights in steadfast love. He will again have compassion on us; he will tread our iniquities underfoot. You will cast all our sins into the depths of the sea.'),
  v('Psalm 103:10-12', ['confession'],
    'He does not deal with us according to our sins, nor repay us according to our iniquities. For as high as the heavens are above the earth, so great is his steadfast love toward those who fear him; as far as the east is from the west, so far does he remove our transgressions from us.'),

  // ---- Thanksgiving ----
  v('Psalm 100:4-5', ['thanksgiving'],
    'Enter his gates with thanksgiving, and his courts with praise! Give thanks to him; bless his name! For the LORD is good; his steadfast love endures forever, and his faithfulness to all generations.'),
  v('Psalm 107:1', ['thanksgiving'],
    'Oh give thanks to the LORD, for he is good, for his steadfast love endures forever!'),
  v('Psalm 136:1', ['thanksgiving'],
    'Give thanks to the LORD, for he is good, for his steadfast love endures forever.'),
  v('Colossians 3:17', ['thanksgiving'],
    'And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him.'),
  v('2 Corinthians 9:15', ['thanksgiving'],
    'Thanks be to God for his inexpressible gift!'),
  v('Ephesians 5:20', ['thanksgiving'],
    'giving thanks always and for everything to God the Father in the name of our Lord Jesus Christ,'),
  v('James 1:17', ['thanksgiving'],
    'Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shadow due to change.'),
  v('1 Samuel 7:12', ['ebenezer', 'thanksgiving'],
    'Then Samuel took a stone and set it up between Mizpah and Shen and called its name Ebenezer; for he said, “Till now the LORD has helped us.”'),

  // ---- Intercession and categories ----
  v('1 Timothy 2:1-4', ['intercession'],
    'First of all, then, I urge that supplications, prayers, intercessions, and thanksgivings be made for all people, for kings and all who are in high positions, that we may lead a peaceful and quiet life, godly and dignified in every way. This is good, and it is pleasing in the sight of God our Savior, who desires all people to be saved and to come to the knowledge of the truth.'),
  v('Matthew 9:37-38', ['intercession'],
    'Then he said to his disciples, “The harvest is plentiful, but the laborers are few; therefore pray earnestly to the Lord of the harvest to send out laborers into his harvest.”'),
  v('Romans 10:1', ['intercession'],
    'Brothers, my heart’s desire and prayer to God for them is that they may be saved.'),
  v('Ezekiel 36:26', ['intercession'],
    'And I will give you a new heart, and a new spirit I will put within you. And I will remove the heart of stone from your flesh and give you a heart of flesh.'),
  v('2 Timothy 2:25-26', ['intercession'],
    'correcting his opponents with gentleness. God may perhaps grant them repentance leading to a knowledge of the truth, and they may come to their senses and escape from the snare of the devil, after being captured by him to do his will.'),
  v('Hebrews 13:3', ['intercession'],
    'Remember those who are in prison, as though in prison with them, and those who are mistreated, since you also are in the body.'),
  v('Ephesians 3:14-19', ['intercession'],
    'For this reason I bow my knees before the Father, from whom every family in heaven and on earth is named, that according to the riches of his glory he may grant you to be strengthened with power through his Spirit in your inner being, so that Christ may dwell in your hearts through faith—that you, being rooted and grounded in love, may have strength to comprehend with all the saints what is the breadth and length and height and depth, and to know the love of Christ that surpasses knowledge, that you may be filled with all the fullness of God.'),
  v('Colossians 1:9-12', ['intercession'],
    'And so, from the day we heard, we have not ceased to pray for you, asking that you may be filled with the knowledge of his will in all spiritual wisdom and understanding, so as to walk in a manner worthy of the Lord, fully pleasing to him: bearing fruit in every good work and increasing in the knowledge of God; being strengthened with all power, according to his glorious might, for all endurance and patience with joy; giving thanks to the Father, who has qualified you to share in the inheritance of the saints in light.'),
  v('Philippians 1:9-11', ['intercession'],
    'And it is my prayer that your love may abound more and more, with knowledge and all discernment, so that you may approve what is excellent, and so be pure and blameless for the day of Christ, filled with the fruit of righteousness that comes through Jesus Christ, to the glory and praise of God.'),
  v('Ephesians 1:16-19', ['intercession'],
    'I do not cease to give thanks for you, remembering you in my prayers, that the God of our Lord Jesus Christ, the Father of glory, may give you the Spirit of wisdom and of revelation in the knowledge of him, having the eyes of your hearts enlightened, that you may know what is the hope to which he has called you, what are the riches of his glorious inheritance in the saints, and what is the immeasurable greatness of his power toward us who believe, according to the working of his great might'),
  v('Acts 2:39', ['intercession'],
    'For the promise is for you and for your children and for all who are far off, everyone whom the Lord our God calls to himself.”'),
  v('Psalm 103:17-18', ['intercession'],
    'But the steadfast love of the LORD is from everlasting to everlasting on those who fear him, and his righteousness to children’s children, to those who keep his covenant and remember to do his commandments.'),
  v('Deuteronomy 6:6-7', ['intercession'],
    'And these words that I command you today shall be on your heart. You shall teach them diligently to your children, and shall talk of them when you sit in your house, and when you walk by the way, and when you lie down, and when you rise.'),
  v('Joshua 24:15', ['intercession'],
    'And if it is evil in your eyes to serve the LORD, choose this day whom you will serve, whether the gods your fathers served in the region beyond the River, or the gods of the Amorites in whose land you dwell. But as for me and my house, we will serve the LORD.”'),
  v('2 Thessalonians 3:1', ['intercession'],
    'Finally, brothers, pray for us, that the word of the Lord may speed ahead and be honored, as happened among you,'),
  v('Colossians 4:3-4', ['intercession'],
    'At the same time, pray also for us, that God may open to us a door for the word, to declare the mystery of Christ, on account of which I am in prison—that I may make it clear, which is how I ought to speak.'),
  v('1 Thessalonians 5:23-24', ['intercession'],
    'Now may the God of peace himself sanctify you completely, and may your whole spirit and soul and body be kept blameless at the coming of our Lord Jesus Christ. He who calls you is faithful; he will surely do it.'),

  // ---- Kingdom and will ----
  v('Psalm 2:8', ['kingdom'],
    'Ask of me, and I will make the nations your heritage, and the ends of the earth your possession.'),
  v('Habakkuk 2:14', ['kingdom'],
    'For the earth will be filled with the knowledge of the glory of the LORD as the waters cover the sea.'),
  v('Revelation 22:20', ['kingdom'],
    'He who testifies to these things says, “Surely I am coming soon.” Amen. Come, Lord Jesus!'),
  v('Matthew 6:33', ['kingdom'],
    'But seek first the kingdom of God and his righteousness, and all these things will be added to you.'),
  v('Luke 22:42', ['kingdom'],
    'saying, “Father, if you are willing, remove this cup from me. Nevertheless, not my will, but yours, be done.”'),
  v('Psalm 40:8', ['kingdom'],
    'I delight to do your will, O my God; your law is within my heart.”'),
  v('2 Corinthians 12:8-9', ['kingdom'],
    'Three times I pleaded with the Lord about this, that it should leave me. But he said to me, “My grace is sufficient for you, for my power is made perfect in weakness.” Therefore I will boast all the more gladly of my weaknesses, so that the power of Christ may rest upon me.'),

  // ---- Daily bread ----
  v('Proverbs 30:8-9', ['provision'],
    'Remove far from me falsehood and lying; give me neither poverty nor riches; feed me with the food that is needful for me, lest I be full and deny you and say, “Who is the LORD?” or lest I be poor and steal and profane the name of my God.'),
  v('Philippians 4:19', ['provision'],
    'And my God will supply every need of yours according to his riches in glory in Christ Jesus.'),

  // ---- Forgiveness and temptation ----
  v('Ephesians 4:32', ['forgiveness'],
    'Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.'),
  v('Matthew 6:14-15', ['forgiveness'],
    'For if you forgive others their trespasses, your heavenly Father will also forgive you, but if you do not forgive others their trespasses, neither will your Father forgive your trespasses.'),
  v('Matthew 26:41', ['forgiveness'],
    'Watch and pray that you may not enter into temptation. The spirit indeed is willing, but the flesh is weak.”'),
  v('1 Corinthians 10:13', ['forgiveness'],
    'No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape, that you may be able to endure it.'),
  v('James 1:5', ['forgiveness'],
    'If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.'),
  v('Psalm 119:18', ['forgiveness'],
    'Open my eyes, that I may behold wondrous things out of your law.'),

  // ---- The Lord's Day ----
  v('Exodus 20:8', ['lordsday'],
    '“Remember the Sabbath day, to keep it holy.'),
  v('Isaiah 58:13-14', ['lordsday'],
    '“If you turn back your foot from the Sabbath, from doing your pleasure on my holy day, and call the Sabbath a delight and the holy day of the LORD honorable; if you honor it, not going your own ways, or seeking your own pleasure, or talking idly; then you shall take delight in the LORD, and I will make you ride on the heights of the earth; I will feed you with the heritage of Jacob your father, for the mouth of the LORD has spoken.”'),
  v('Psalm 118:24', ['lordsday'],
    'This is the day that the LORD has made; let us rejoice and be glad in it.'),
  v('Revelation 1:10', ['lordsday'],
    'I was in the Spirit on the Lord’s day, and I heard behind me a loud voice like a trumpet'),
  v('Hebrews 10:24-25', ['lordsday'],
    'And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another, and all the more as you see the Day drawing near.'),

  // ---- Evening and rest ----
  v('Psalm 4:8', ['evening', 'rest'],
    'In peace I will both lie down and sleep; for you alone, O LORD, make me dwell in safety.'),
  v('Psalm 3:5', ['morning', 'rest'],
    'I lay down and slept; I woke again, for the LORD sustained me.'),

  // ---- Benedictions ----
  v('Numbers 6:24-26', ['benediction'],
    'The LORD bless you and keep you; the LORD make his face to shine upon you and be gracious to you; the LORD lift up his countenance upon you and give you peace.'),
  v('Jude 24-25', ['benediction'],
    'Now to him who is able to keep you from stumbling and to present you blameless before the presence of his glory with great joy, to the only God, our Savior, through Jesus Christ our Lord, be glory, majesty, dominion, and authority, before all time and now and forever. Amen.'),
  v('Hebrews 13:20-21', ['benediction'],
    'Now may the God of peace who brought again from the dead our Lord Jesus, the great shepherd of the sheep, by the blood of the eternal covenant, equip you with everything good that you may do his will, working in us that which is pleasing in his sight, through Jesus Christ, to whom be glory forever and ever. Amen.'),
  v('2 Corinthians 13:14', ['benediction'],
    'The grace of the Lord Jesus Christ and the love of God and the fellowship of the Holy Spirit be with you all.'),
];

const BY_REF = new Map(VERSES.map((verse) => [verse.ref, verse]));

// Exact match on the canonical ref string. Returns the verse object or null.
export function getVerse(ref) {
  return BY_REF.get(ref) || null;
}

// Books with a single chapter, whose refs are written "Jude 24-25".
const SINGLE_CHAPTER_BOOKS = new Set(['Obadiah', 'Philemon', '2 John', '3 John', 'Jude']);

// Local-date day of the year, 1 for January 1. Uses UTC arithmetic on the
// local calendar date so daylight saving changes cannot shift the count.
function localDayOfYear(date) {
  const y = date.getFullYear();
  const today = Date.UTC(y, date.getMonth(), date.getDate());
  return Math.round((today - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

const DAILY = VERSES.filter((verse) => verse.tags.includes('daily'));

// One verse tagged 'daily' for the given day. The same local date always gives
// the same verse, and consecutive days walk through the list in order.
export function verseOfTheDay(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const index = (d.getFullYear() * 366 + localDayOfYear(d)) % DAILY.length;
  return DAILY[index];
}

// Number of verses a ref covers, for keeping the app under Crossway's limit.
// Handles "Book C:V", "Book C:V-W" and single-chapter refs like "Jude 24-25".
// A hyphen or an en dash may separate the range. Returns 0 for a ref it cannot
// read (a whole chapter or a range across chapters), so callers can flag it.
export function countVerses(ref) {
  const m = /^(.+?)\s+(\d+)(?::(\d+))?(?:\s*[-–]\s*(\d+))?$/.exec(String(ref ?? '').trim());
  if (!m) return 0;
  const [, book, first, second, end] = m;
  let start;
  if (second !== undefined) {
    start = Number(second);
  } else if (SINGLE_CHAPTER_BOOKS.has(book)) {
    start = Number(first);
  } else {
    return 0;
  }
  if (end === undefined) return 1;
  const last = Number(end);
  return last >= start ? last - start + 1 : 0;
}
