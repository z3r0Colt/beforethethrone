/**
 * The Westminster Confession of Faith, chapter 21 (all eight sections), and the
 * Westminster Larger Catechism on prayer, questions 178-196.
 *
 * Public domain. The data below was generated programmatically from the
 * Creeds.json project (github.com/NonlinearFruit/Creeds.json), copying every
 * section, question and answer verbatim. Only typography changed (straight
 * quotes to curly ones, whitespace tidied), plus these corrections of obvious
 * source errors, checked against the received text (OPC / PCA / RPCNA editions):
 *   WLC 182: "We not knowing: What to pray" -> "We not knowing what to pray"
 *   WLC 182: "for whom, and: What, and: How prayer" -> "for whom, and what, and how prayer"
 *   WLC 184: "our own or others good" -> "our own or others’ good"
 *   WLC 190: "to honor God aright, pray, that" -> "to honor God aright, we pray, that"
 *   WLC 190: "profaneness, and: whatsoever" -> "profaneness, and whatsoever"
 *   WLC 191: "in the second petition.?" -> "in the second petition?"
 *   WCF 21.1: "and so limited to his own revealed will" -> "and so limited by his own revealed will"
 *   WCF 21.1: "under any visible representations or" -> "under any visible representation or"
 *   WCF 21.5: "thanksgivings upon several occasions" -> "thanksgivings upon special occasions"
 *   WLC 186 proof: Matt.6.2-Matt.6.13 -> Matt.6.9-Matt.6.13
 *
 * `proofs` lists the Scripture proofs in footnote order, in the Creeds.json
 * form ('Exod.20.4-Exod.20.6'). Use formatProofRef() from ./catechism.js to
 * make them readable.
 *
 * Self-contained data module: no imports. The helper functions at the bottom
 * are hand-written.
 */

/** Public domain note for the Westminster Standards in general. */
export const STANDARDS_SOURCE_NOTE = 'The Westminster Standards (1640s) are in the public domain. The text comes from the Creeds.json project (github.com/NonlinearFruit/Creeds.json), with a few small printing errors corrected against the received text.';

/** Public domain note shown beside the Confession text. */
export const WCF_SOURCE_NOTE = 'The Westminster Confession of Faith is one of the Westminster Standards (1640s), which are in the public domain. The text comes from the Creeds.json project (github.com/NonlinearFruit/Creeds.json), with a few small printing errors corrected against the received text.';

/** Public domain note shown beside the Larger Catechism text. */
export const WLC_SOURCE_NOTE = 'The Westminster Larger Catechism is one of the Westminster Standards (1640s), which are in the public domain. The text comes from the Creeds.json project (github.com/NonlinearFruit/Creeds.json), with a few small printing errors corrected against the received text.';

/** Westminster Confession of Faith, chapter 21. */
export const WCF_21 = {
  chapter: 21,
  title: 'Of Religious Worship, and the Sabbath Day',
  sections: [
    {
      n: 1,
      text: 'The light of nature showeth that there is a God, who hath lordship and sovereignty over all; is good, and doeth good unto all; and is therefore to be feared, loved, praised, called upon, trusted in, and served with all the heart, and with all the soul, and with all the might. But the acceptable way of worshipping the true God is instituted by himself, and so limited by his own revealed will, that he may not be worshipped according to the imaginations and devices of men, or the suggestions of Satan, under any visible representation or any other way not prescribed in the Holy Scripture.',
      proofs: [
        'Josh.24.14', 'Ps.18.3', 'Ps.31.23', 'Ps.62.8', 'Ps.119.68', 'Jer.10.7', 'Mark.12.33',
        'Acts.17.24', 'Rom.1.20', 'Rom.10.12', 'Exod.20.4-Exod.20.6', 'Deut.4.15-Deut.4.20',
        'Deut.12.32', 'Matt.4.9-Matt.4.10', 'Matt.15.9', 'Acts.17.25', 'Col.2.23',
      ],
    },
    {
      n: 2,
      text: 'Religious worship is to be given to God, the Father, Son, and Holy Ghost; and to him alone: not to angels, saints, or any other creature: and since the fall, not without a Mediator; nor in the mediation of any other but of Christ alone.',
      proofs: [
        'Matt.4.10', 'John.5.23', '2Cor.13.14', 'Rom.1.25', 'Col.2.18', 'Rev.19.10', 'John.14.6',
        'Eph.2.18', 'Col.3.17', '1Tim.2.5',
      ],
    },
    {
      n: 3,
      text: 'Prayer with thanksgiving, being one special part of religious worship, is by God required of all men; and that it may be accepted, it is to be made in the name of the Son, by the help of his Spirit, according to his will, with understanding, reverence, humility, fervency, faith, love, and perseverance; and, if vocal, in a known tongue.',
      proofs: [
        'Phil.4.6', 'Ps.65.2', 'John.14.13-John.14.14', '1Pet.2.5', 'Rom.8.26', '1John.5.14',
        'Gen.18.27', 'Ps.47.7', 'Eccl.5.1-Eccl.5.2', 'Matt.6.12', 'Matt.6.14-Matt.6.15',
        'Mark.11.24', 'Eph.6.18', 'Col.4.2', 'Heb.12.28', 'Jas.1.6-Jas.1.7', 'Jas.5.16',
        '1Cor.14.14',
      ],
    },
    {
      n: 4,
      text: 'Prayer is to be made for things lawful, and for all sorts of men living, or that shall live hereafter; but not for the dead, nor for those of whom it may be known that they have sinned the sin unto death.',
      proofs: [
        '1John.5.14', 'Ruth.4.12', '2Sam.7.29', 'John.17.20', '1Tim.2.1-1Tim.2.2',
        '2Sam.12.21-2Sam.12.23', 'Luke.16.25-Luke.16.26', 'Rev.14.13', '1John.5.16',
      ],
    },
    {
      n: 5,
      text: 'The reading of the Scriptures with godly fear; the sound preaching; and conscionable hearing of the Word, in obedience unto God with understanding, faith, and reverence; singing of Psalms with grace in the heart; as, also, the due administration and worthy receiving of the sacraments instituted by Christ; are all parts of the ordinary religious worship of God: besides religious oaths, vows, solemn fastings, and thanksgivings upon special occasions; which are, in their several times and seasons, to be used in an holy and religious manner.',
      proofs: [
        'Acts.15.21', 'Rev.1.3', '2Tim.4.2', 'Isa.66.2', 'Matt.13.19', 'Acts.10.33', 'Heb.4.2',
        'Jas.1.22', 'Eph.5.19', 'Col.3.16', 'Jas.5.13', 'Matt.28.19', 'Acts.2.42',
        '1Cor.11.23-1Cor.11.29', 'Deut.6.13', 'Neh.10.29', 'Isa.19.21', 'Eccl.5.4-Eccl.5.5',
        'Esth.4.16', 'Joel.2.12', 'Matt.9.15', '1Cor.7.5', 'Esth.9.22', 'Ps.107', 'Heb.12.28',
      ],
    },
    {
      n: 6,
      text: 'Neither prayer, nor any other part of religious worship, is now, under the gospel, either tied unto, or made more acceptable by any place in which it is performed, or towards which it is directed: but God is to be worshipped everywhere in spirit and truth; as in private families daily, and in secret each one by himself, so more solemnly in the public assemblies, which are not carelessly or willfully to be neglected or forsaken, when God, by his Word or providence, calleth thereunto.',
      proofs: [
        'John.4.21', 'Mal.1.11', '1Tim.2.8', 'John.4.23-John.4.24', 'Deut.6.6-Deut.6.7',
        '2Sam.6.18', '2Sam.6.20', 'Job.1.5', 'Jer.10.25', 'Acts.10.2', '1Pet.3.7', 'Matt.6.11',
        'Matt.6.6', 'Eph.6.18', 'Isa.56.6-Isa.56.7', 'Prov.1.20-Prov.1.21', 'Prov.1.24',
        'Prov.8.34', 'Luke.4.16', 'Acts.2.42', 'Acts.13.42', 'Heb.10.25',
      ],
    },
    {
      n: 7,
      text: 'As it is of the law of nature that, in general, a due proportion of time be set apart for the worship of God; so, in his Word, by a positive, moral, and perpetual commandment, binding all men in all ages, he hath particularly appointed one day in seven for a Sabbath, to be kept holy unto him: which, from the beginning of the world to the resurrection of Christ, was the last day of the week; and, from the resurrection of Christ, was changed into the first day of the week, which in Scripture is called the Lord’s day, and is to be continued to the end of the world, as the Christian Sabbath.',
      proofs: [
        'Exod.20.8', 'Exod.20.10-Exod.20.11', 'Isa.56.2', 'Isa.56.4', 'Isa.56.6-Isa.56.7',
        'Gen.2.2-Gen.2.3', 'Acts.20.7', '1Cor.16.1-1Cor.16.2', 'Rev.1.10', 'Exod.20.8',
        'Exod.20.10', 'Matt.5.17-Matt.5.18',
      ],
    },
    {
      n: 8,
      text: 'This Sabbath is then kept holy unto the Lord, when men, after a due preparing of their hearts, and ordering of their common affairs beforehand, do not only observe an holy rest all the day from their own works, words, and thoughts, about their worldly employments and recreations; but also are taken up the whole time in the public and private exercises of his worship, and in the duties of necessity and mercy.',
      proofs: [
        'Exod.20.8', 'Exod.16.23', 'Exod.16.25-Exod.16.26', 'Exod.16.29-Exod.16.30',
        'Exod.31.15-Exod.31.17', 'Isa.58.13', 'Neh.13.15-Neh.13.22', 'Isa.58.13',
        'Matt.12.1-Matt.12.13',
      ],
    },
  ],
};

/** Westminster Larger Catechism questions 178-196 (prayer), [{ n, q, a, proofs }]. */
export const WLC_PRAYER = [
  {
    n: 178,
    q: 'What is prayer?',
    a: 'Prayer is an offering up of our desires unto God, in the name of Christ, by the help of his Spirit; with confession of our sins, and thankful acknowledgment of his mercies.',
    proofs: ['Ps.62.8', 'John.16.23', 'Rom.8.26', 'Ps.32.5-Ps.32.6', 'Dan.9.4', 'Phil.4.6'],
  },
  {
    n: 179,
    q: 'Are we to pray unto God only?',
    a: 'God only being able to search the hearts, hear the requests, pardon the sins, and fulfil the desires of all; and only to be believed in, and worshiped with religious worship; prayer, which is a special part thereof, is to be made by all to him alone, and to none other.',
    proofs: [
      '1Kgs.8.39', 'Acts.1.24', 'Rom.8.27', 'Ps.65.2', 'Mic.7.18', 'Ps.145.18-Ps.145.19',
      'Rom.10.14', 'Matt.4.10', '1Cor.1.2', 'Ps.50.15', 'Rom.10.14',
    ],
  },
  {
    n: 180,
    q: 'What is it to pray in the name of Christ?',
    a: 'To pray in the name of Christ is, in obedience to his command, and in confidence on his promises, to ask mercy for his sake; not by bare mentioning of his name, but by drawing our encouragement to pray, and our boldness, strength, and hope of acceptance in prayer, from Christ and his mediation.',
    proofs: [
      'John.14.13-John.14.14,John.16.24', 'Dan.9.17', 'Matt.7.21', 'Heb.4.14-Heb.4.16',
      '1John.5.13-1John.5.15',
    ],
  },
  {
    n: 181,
    q: 'Why are we to pray in the name of Christ?',
    a: 'The sinfulness of man, and his distance from God by reason thereof, being so great, as that we can have no access into his presence without a mediator; and there being none in heaven or earth appointed to, or fit for, that glorious work but Christ alone, we are to pray in no other name but his only.',
    proofs: [
      'John.14.6', 'Isa.59.2', 'Eph.3.12', 'John.6.27', 'Heb.7.25-Heb.7.27', '1Tim.2.5', 'Col.3.17',
      'Heb.13.15',
    ],
  },
  {
    n: 182,
    q: 'How doth the Spirit help us to pray?',
    a: 'We not knowing what to pray for as we ought, the Spirit helps our infirmities, by enabling us to understand both for whom, and what, and how prayer is to be made; and by working and quickening in our hearts (although not in all persons, nor at all times, in the same measure) those apprehensions, affections, and graces which are requisite for the right performance of that duty.',
    proofs: ['Rom.8.26-Rom.8.27', 'Ps.10.17', 'Zech.12.10'],
  },
  {
    n: 183,
    q: 'For whom are we to pray?',
    a: 'We are to pray for the whole church of Christ upon earth; for magistrates, and ministers; for ourselves, our brethren, yea, our enemies; and for all sorts of men living, or that shall live hereafter; but not for the dead, nor for those that are known to have sinned the sin unto death.',
    proofs: [
      'Eph.6.18', 'Ps.28.9', '1Tim.2.1-1Tim.2.2', 'Col.4.3', 'Gen.32.11', 'Jas.5.16', 'Matt.5.44',
      '1Tim.2.1-1Tim.2.2', 'John.17.20', '2Sam.7.29', '2Sam.12.21-2Sam.12.23', '1John.5.16',
    ],
  },
  {
    n: 184,
    q: 'For what things are we to pray?',
    a: 'We are to pray for all things tending to the glory of God, the welfare of the church, our own or others’ good; but not for anything that is unlawful.',
    proofs: ['Matt.6.9', 'Ps.51.18,Ps.122.6', 'Matt.7.11', 'Ps.125.4', '1John.5.14'],
  },
  {
    n: 185,
    q: 'How are we to pray?',
    a: 'We are to pray with an awful apprehension of the majesty of God, and deep sense of our own unworthiness, necessities, and sins; with penitent, thankful, and enlarged hearts; with understanding, faith, sincerity, fervency, love, and perseverance, waiting upon him, with humble submission to his will.',
    proofs: [
      'Eccl.5.1', 'Gen.18.27', 'Gen.32.10', 'Luke.15.17-Luke.15.19', 'Luke.18.13-Luke.18.14',
      'Ps.51.17', 'Phil.4.6', '1Sam.1.15,1Sam.2.1', '1Cor.14.15', 'Mark.11.24', 'Jas.1.6',
      'Ps.17.1', 'Ps.145.18', 'Jas.5.16', '1Tim.2.8', 'Eph.6.18', 'Mic.7.7', 'Matt.26.39',
    ],
  },
  {
    n: 186,
    q: 'What rule hath God given for our direction in the duty of prayer?',
    a: 'The whole word of God is of use to direct us in the duty of prayer; but the special rule of direction is that form of prayer which our Savior Christ taught his disciples, commonly called The Lord’s prayer.',
    proofs: ['1John.5.14', 'Matt.6.9-Matt.6.13', 'Luke.11.2-Luke.11.4'],
  },
  {
    n: 187,
    q: 'How is the Lord’s prayer to be used?',
    a: 'The Lord’s prayer is not only for direction, as a pattern, according to which we are to make other prayers; but may also be used as a prayer, so that it be done with understanding, faith, reverence, and other graces necessary to the right performance of the duty of prayer.',
    proofs: ['Matt.6.9', 'Luke.11.2'],
  },
  {
    n: 188,
    q: 'Of how many parts doth the Lord’s prayer consist?',
    a: 'The Lord’s prayer consists of three parts; a preface, petitions, and a conclusion.',
    proofs: [],
  },
  {
    n: 189,
    q: 'What doth the preface of the Lord’s prayer teach us?',
    a: 'The preface of the Lord’s prayer (contained in these words, Our Father which art in heaven,) teacheth us, when we pray, to draw near to God with confidence of his fatherly goodness, and our interest therein; with reverence, and all other childlike dispositions, heavenly affections, and due apprehensions of his sovereign power, majesty, and gracious condescension: as also, to pray with and for others.',
    proofs: [
      'Matt.6.9', 'Luke.11.13', 'Rom.8.15', 'Isa.64.9', 'Ps.123.1', 'Lam.3.41',
      'Isa.63.15-Isa.63.16', 'Neh.1.4-Neh.1.6', 'Acts.12.5',
    ],
  },
  {
    n: 190,
    q: 'What do we pray for in the first petition?',
    a: 'In the first petition (which is, Hallowed be thy name,) acknowledging the utter inability and indisposition that is in ourselves and all men to honor God aright, we pray, that God would by his grace enable and incline us and others to know, to acknowledge, and highly to esteem him, his titles, attributes, ordinances, word, works, and whatsoever he is pleased to make himself known by; and to glorify him in thought, word, and deed: that he would prevent and remove atheism, ignorance, idolatry, profaneness, and whatsoever is dishonorable to him; and, by his overruling providence, direct and dispose of all things to his own glory.',
    proofs: [
      'Matt.6.9', '2Cor.3.5', 'Ps.51.15', 'Ps.67.2-Ps.67.3', 'Ps.83.18',
      'Ps.86.10-Ps.86.13,Ps.86.15', '2Thess.3.1', 'Ps.138.1-Ps.138.3', 'Ps.147.19-Ps.147.20',
      '2Cor.2.14-2Cor.2.15', 'Ps.145', 'Ps.8', 'Ps.19.14', 'Ps.103.1', 'Phil.1.9,Phil.1.11',
      'Ps.67.1-Ps.67.4', 'Eph.1.17-Eph.1.18', 'Ps.97.7', 'Ps.74.18,Ps.74.22-Ps.74.23',
      '2Kgs.19.15-2Kgs.19.16', '2Chr.20.6,2Chr.20.10-2Chr.20.12', 'Ps.83', 'Ps.140.4,Ps.140.8',
    ],
  },
  {
    n: 191,
    q: 'What do we pray for in the second petition?',
    a: 'In the second petition (which is, Thy kingdom come,) acknowledging ourselves and all mankind to be by nature under the dominion of sin and Satan, we pray, that the kingdom of sin and Satan may be destroyed, the gospel propagated throughout the world, the Jews called, the fulness of the Gentiles brought in; the church furnished with all gospel officers and ordinances, purged from corruption, countenanced and maintained by the civil magistrate: that the ordinances of Christ may be purely dispensed, and made effectual to the converting of those that are yet in their sins, and the confirming, comforting, and building up of those that are already converted: that Christ would rule in our hearts here, and hasten the time of his second coming, and our reigning with him forever: and that he would be pleased so to exercise the kingdom of his power in all the world, as may best conduce to these ends.',
    proofs: [
      'Matt.6.10', 'Eph.2.2-Eph.2.3', 'Ps.68.1,Ps.68.18', 'Rev.12.10-Rev.12.11', '2Thess.3.1',
      'Rom.10.1', 'John.17.9,John.17.20', 'Rom.11.25-Rom.11.26', 'Ps.67', 'Matt.9.38', '2Thess.3.1',
      'Mal.1.11', 'Zeph.3.9', '1Tim.2.1-1Tim.2.2', 'Acts.4.29-Acts.4.30', 'Eph.6.18-Eph.6.20',
      'Rom.15.29-Rom.15.30,Rom.15.32', '2Thess.1.11', '2Thess.2.16-2Thess.2.17',
      'Eph.3.14-Eph.3.20', 'Rev.22.20', 'Isa.64.1-Isa.64.2', 'Rev.4.8-Rev.4.11',
    ],
  },
  {
    n: 192,
    q: 'What do we pray for in the third petition?',
    a: 'In the third petition (which is, Thy will be done in earth, as it is in heaven,) acknowledging, that by nature we and all men are not only utterly unable and unwilling to know and do the will of God, but prone to rebel against his word, to repine and murmur against his providence, and wholly inclined to do the will of the flesh, and of the devil: we pray, that God would by his Spirit take away from ourselves and others all blindness, weakness, indisposedness, and perverseness of heart; and by his grace make us able and willing to know, do, and submit to his will in all things, with the like humility, cheerfulness, faithfulness, diligence, zeal, sincerity, and constancy, as the angels do in heaven.',
    proofs: [
      'Matt.6.10', 'Rom.7.18', 'Job.21.14', '1Cor.2.14', 'Rom.8.7', 'Exod.17.7', 'Num.14.2',
      'Eph.2.2', 'Eph.1.17-Eph.1.18', 'Eph.3.16', 'Matt.26.40-Matt.26.41', 'Jer.31.18-Jer.31.19',
      'Ps.119.1,Ps.119.8,Ps.119.35-Ps.119.36', 'Acts.21.14', 'Mic.6.8', 'Ps.100.2', 'Job.1.21',
      '2Sam.15.25-2Sam.15.26', 'Isa.38.3', 'Ps.119.4-Ps.119.5', 'Rom.12.11', 'Ps.119.80',
      'Ps.119.112', 'Isa.6.2-Isa.6.3', 'Ps.103.20-Ps.103.21', 'Matt.18.10',
    ],
  },
  {
    n: 193,
    q: 'What do we pray for in the fourth petition?',
    a: 'In the fourth petition (which is, Give us this day our daily bread,) acknowledging, that in Adam, and by our own sin, we have forfeited our right to all the outward blessings of this life, and deserve to be wholly deprived of them by God, and to have them cursed to us in the use of them; and that neither they of themselves are able to sustain us, nor we to merit, or by our own industry to procure them; but prone to desire, get, and use them unlawfully: we pray for ourselves and others, that both they and we, waiting upon the providence of God from day to day in the use of lawful means, may, of his free gift, and as to his fatherly wisdom shall seem best, enjoy a competent portion of them; and have the same continued and blessed unto us in our holy and comfortable use of them, and contentment in them; and be kept from all things that are contrary to our temporal support and comfort.',
    proofs: [
      'Matt.6.11', 'Gen.2.17,Gen.3.17', 'Rom.8.20-Rom.8.22', 'Jer.5.25', 'Deut.28.15-Deut.28.68',
      'Deut.8.3', 'Gen.32.10', 'Deut.8.17-Deut.8.18', 'Jer.6.13', 'Mark.7.21-Mark.7.22', 'Hos.12.7',
      'Jas.4.3', 'Gen.28.20', 'Gen.43.12-Gen.43.14', 'Eph.4.28', '2Thess.3.11-2Thess.3.12',
      'Phil.4.6', '1Tim.4.3-1Tim.4.5', '1Tim.6.6-1Tim.6.8', 'Prov.30.8-Prov.30.9',
    ],
  },
  {
    n: 194,
    q: 'What do we pray for in the fifth petition?',
    a: 'In the fifth petition (which is, Forgive us our debts, as we forgive our debtors,) acknowledging, that we and all others are guilty both of original and actual sin, and thereby become debtors to the justice of God; and that neither we, nor any other creature, can make the least satisfaction for that debt: we pray for ourselves and others, that God of his free grace would, through the obedience and satisfaction of Christ, apprehended and applied by faith, acquit us both from the guilt and punishment of sin, accept us in his Beloved; continue his favor and grace to us, pardon our daily failings, and fill us with peace and joy, in giving us daily more and more assurance of forgiveness; which we are the rather emboldened to ask, and encouraged to expect, when we have this testimony in ourselves, that we from the heart forgive others their offenses.',
    proofs: [
      'Matt.6.12', 'Rom.3.9-Rom.3.22', 'Matt.18.24-Matt.18.25', 'Ps.130.3-Ps.130.4',
      'Rom.3.24-Rom.3.26', 'Heb.9.22', 'Eph.1.6-Eph.1.7', '2Pet.1.2', 'Hos.14.2', 'Jer.14.7',
      'Rom.15.13', 'Ps.51.7-Ps.51.10,Ps.51.12', 'Luke.11.4', 'Matt.6.14-Matt.6.15', 'Matt.18.35',
    ],
  },
  {
    n: 195,
    q: 'What do we pray for in the sixth petition?',
    a: 'In the sixth petition (which is, And lead us not into temptation, but deliver us from evil,) acknowledging, that the most wise, righteous, and gracious God, for divers holy and just ends, may so order things, that we may be assaulted, foiled, and for a time led captive by temptations; that Satan, the world, and the flesh, are ready powerfully to draw us aside, and ensnare us; and that we, even after the pardon of our sins, by reason of our corruption, weakness, and want of watchfulness, are not only subject to be tempted, and forward to expose ourselves unto temptations, but also of ourselves unable and unwilling to resist them, to recover out of them, and to improve them; and worthy to be left under the power of them: we pray, that God would so overrule the world and all in it, subdue the flesh, and restrain Satan, order all things, bestow and bless all means of grace, and quicken us to watchfulness in the use of them, that we and all his people may by his providence be kept from being tempted to sin; or, if tempted, that by his Spirit we may be powerfully supported and enabled to stand in the hour of temptation; or when fallen, raised again and recovered out of it, and have a sanctified use and improvement thereof: that our sanctification and salvation may be perfected, Satan trodden under our feet, and we fully freed from sin, temptation, and all evil, forever.',
    proofs: [
      'Matt.6.13', '2Chr.32.31', '1Chr.21.1', 'Luke.21.34', 'Mark.4.19', 'Jas.1.14', 'Gal.5.17',
      'Matt.26.41', 'Matt.26.69-Matt.26.72', 'Gal.2.11-Gal.2.14', '2Chr.18.3', '2Chr.19.2',
      'Rom.7.23-Rom.7.24', '1Chr.21.1-1Chr.21.4', '2Chr.16.7-2Chr.16.10', 'Ps.81.11-Ps.81.12',
      'John.17.15', 'Ps.51.10', 'Ps.119.133', '2Cor.12.7-2Cor.12.8', '1Cor.10.12-1Cor.10.13',
      'Heb.13.20-Heb.13.21', 'Matt.26.41', 'Ps.19.13', 'Eph.3.14-Eph.3.17', '1Thess.3.13',
      'Jude.1.24', 'Ps.51.12', '1Pet.5.8-1Pet.5.10', '2Cor.13.7,2Cor.13.9', 'Rom.16.20', 'Zech.3.2',
      'Luke.22.31-Luke.22.32', 'John.17.15', '1Thess.5.23',
    ],
  },
  {
    n: 196,
    q: 'What doth the conclusion of the Lord’s prayer teach us?',
    a: 'The conclusion of the Lord’s prayer (which is, For thine is the kingdom, and the power, and the glory, forever. Amen.), teaches us to enforce our petitions with arguments, which are to be taken, not from any worthiness in ourselves, or in any other creature, but from God; and with our prayers to join praises, ascribing to God alone eternal sovereignty, omnipotency, and glorious excellency; in regard whereof, as he is able and willing to help us, so we by faith are emboldened to plead with him that he would, and quietly to rely upon him, that he will fulfil our requests. And, to testify this our desire and assurance, we say, Amen.',
    proofs: [
      'Matt.6.13', 'Rom.15.30', 'Dan.9.4,Dan.9.7-Dan.9.9,Dan.9.16-Dan.9.19', 'Phil.4.6',
      '1Chr.29.10-1Chr.29.13', 'Eph.3.20-Eph.3.21', 'Luke.11.13', '2Chr.20.6,2Chr.20.11',
      '2Chr.14.11', '1Cor.14.16', 'Rev.22.20-Rev.22.21',
    ],
  },
];

/** Look up a Larger Catechism question on prayer by number (178..196), or null. */
export function getWLC(n) {
  return WLC_PRAYER.find((q) => q.n === Number(n)) || null;
}

/** Look up a section of Confession chapter 21 by number (1..8), or null. */
export function getWCF21Section(n) {
  return WCF_21.sections.find((s) => s.n === Number(n)) || null;
}
