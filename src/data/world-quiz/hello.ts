/** Static teaching data; source URLs are provenance, never runtime downloads. */
/** Choices are greeting words, not countries: shared languages must not create several correct country answers.
 * Each distractor is from a different language and another quiz country on the same continent. */
export const HELLO_QUESTIONS = [
  {
    "id": "hello-eg",
    "iso2": "eg",
    "prompt": "This is how people say hello in Egypt (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 0,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-za",
    "iso2": "za",
    "prompt": "This is how people say hello in South Africa (Zulu). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 3,
    "language": "Zulu",
    "pronunciation": "sah-woo-BOH-nah"
  },
  {
    "id": "hello-ke",
    "iso2": "ke",
    "prompt": "This is how people say hello in Kenya (Swahili). Choose the greeting.",
    "options": [
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 2,
    "language": "Swahili",
    "pronunciation": "JAM-boh"
  },
  {
    "id": "hello-ng",
    "iso2": "ng",
    "prompt": "This is how people say hello in Nigeria (English). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 1,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-ma",
    "iso2": "ma",
    "prompt": "This is how people say hello in Morocco (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "ma",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 0,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-et",
    "iso2": "et",
    "prompt": "This is how people say hello in Ethiopia (Amharic). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "ሰላም",
        "language": "Amharic",
        "fromIso2": "et",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E1%88%B0%E1%88%8B%E1%88%9D"
      }
    ],
    "correctIndex": 3,
    "language": "Amharic",
    "pronunciation": "seh-LAHM"
  },
  {
    "id": "hello-gh",
    "iso2": "gh",
    "prompt": "This is how people say hello in Ghana (English). Choose the greeting.",
    "options": [
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gh",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 2,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-tz",
    "iso2": "tz",
    "prompt": "This is how people say hello in Tanzania (Swahili). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "tz",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 1,
    "language": "Swahili",
    "pronunciation": "JAM-boh"
  },
  {
    "id": "hello-dz",
    "iso2": "dz",
    "prompt": "This is how people say hello in Algeria (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "dz",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 0,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-mg",
    "iso2": "mg",
    "prompt": "This is how people say hello in Madagascar (Malagasy). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Salama",
        "language": "Malagasy",
        "fromIso2": "mg",
        "sourceUrl": "https://en.wiktionary.org/wiki/salama"
      }
    ],
    "correctIndex": 3,
    "language": "Malagasy",
    "pronunciation": "sah-LAH-mah"
  },
  {
    "id": "hello-tn",
    "iso2": "tn",
    "prompt": "This is how people say hello in Tunisia (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "tn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 2,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-sn",
    "iso2": "sn",
    "prompt": "This is how people say hello in Senegal (French). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "sn",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 1,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-cm",
    "iso2": "cm",
    "prompt": "This is how people say hello in Cameroon (French). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "cm",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      }
    ],
    "correctIndex": 0,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-ug",
    "iso2": "ug",
    "prompt": "This is how people say hello in Uganda (Swahili). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ug",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      }
    ],
    "correctIndex": 3,
    "language": "Swahili",
    "pronunciation": "JAM-boh"
  },
  {
    "id": "hello-ly",
    "iso2": "ly",
    "prompt": "This is how people say hello in Libya (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "ly",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 2,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-so",
    "iso2": "so",
    "prompt": "This is how people say hello in Somalia (Somali). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Salaan",
        "language": "Somali",
        "fromIso2": "so",
        "sourceUrl": "https://en.wiktionary.org/wiki/salaan"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 1,
    "language": "Somali",
    "pronunciation": "sah-LAHN"
  },
  {
    "id": "hello-sd",
    "iso2": "sd",
    "prompt": "This is how people say hello in Sudan (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "sd",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 0,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-td",
    "iso2": "td",
    "prompt": "This is how people say hello in Chad (French). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "td",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 3,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-ml",
    "iso2": "ml",
    "prompt": "This is how people say hello in Mali (French). Choose the greeting.",
    "options": [
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ml",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 2,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-ne",
    "iso2": "ne",
    "prompt": "This is how people say hello in Niger (Hausa). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Sannu",
        "language": "Hausa",
        "fromIso2": "ne",
        "sourceUrl": "https://en.wiktionary.org/wiki/sannu"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 1,
    "language": "Hausa",
    "pronunciation": "SAN-noo"
  },
  {
    "id": "hello-ao",
    "iso2": "ao",
    "prompt": "This is how people say hello in Angola (Portuguese). Choose the greeting.",
    "options": [
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "ao",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      }
    ],
    "correctIndex": 0,
    "language": "Portuguese",
    "pronunciation": "oh-LAH"
  },
  {
    "id": "hello-zm",
    "iso2": "zm",
    "prompt": "This is how people say hello in Zambia (English). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "zm",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 3,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-zw",
    "iso2": "zw",
    "prompt": "This is how people say hello in Zimbabwe (Shona). Choose the greeting.",
    "options": [
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Mhoro",
        "language": "Shona",
        "fromIso2": "zw",
        "sourceUrl": "https://vashona.com/en/dictionary/en/hello"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 2,
    "language": "Shona",
    "pronunciation": "m-HOH-roh"
  },
  {
    "id": "hello-mz",
    "iso2": "mz",
    "prompt": "This is how people say hello in Mozambique (Portuguese). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "mz",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 1,
    "language": "Portuguese",
    "pronunciation": "oh-LAH"
  },
  {
    "id": "hello-bw",
    "iso2": "bw",
    "prompt": "This is how people say hello in Botswana (Tswana). Choose the greeting.",
    "options": [
      {
        "text": "Dumela",
        "language": "Tswana",
        "fromIso2": "bw",
        "sourceUrl": "https://en.wiktionary.org/wiki/dumela"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      }
    ],
    "correctIndex": 0,
    "language": "Tswana",
    "pronunciation": "doo-MEH-lah"
  },
  {
    "id": "hello-na",
    "iso2": "na",
    "prompt": "This is how people say hello in Namibia (English). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "na",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 3,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-rw",
    "iso2": "rw",
    "prompt": "This is how people say hello in Rwanda (Kinyarwanda). Choose the greeting.",
    "options": [
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Muraho",
        "language": "Kinyarwanda",
        "fromIso2": "rw",
        "sourceUrl": "https://en.wiktionary.org/wiki/muraho"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 2,
    "language": "Kinyarwanda",
    "pronunciation": "moo-RAH-hoh"
  },
  {
    "id": "hello-ci",
    "iso2": "ci",
    "prompt": "This is how people say hello in Ivory Coast (French). Choose the greeting.",
    "options": [
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ci",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      }
    ],
    "correctIndex": 1,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-cd",
    "iso2": "cd",
    "prompt": "This is how people say hello in DR Congo (French). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "cd",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "eg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      }
    ],
    "correctIndex": 0,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-mr",
    "iso2": "mr",
    "prompt": "This is how people say hello in Mauritania (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "Sawubona",
        "language": "Zulu",
        "fromIso2": "za",
        "sourceUrl": "https://en.wiktionary.org/wiki/sawubona"
      },
      {
        "text": "Jambo",
        "language": "Swahili",
        "fromIso2": "ke",
        "sourceUrl": "https://en.wiktionary.org/wiki/jambo"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ng",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "mr",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 3,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-jp",
    "iso2": "jp",
    "prompt": "This is how people say hello in Japan (Japanese). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "สวัสดี",
        "language": "Thai",
        "fromIso2": "th",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 2,
    "language": "Japanese",
    "pronunciation": "kon-nee-chee-WAH"
  },
  {
    "id": "hello-cn",
    "iso2": "cn",
    "prompt": "This is how people say hello in China (Mandarin Chinese). Choose the greeting.",
    "options": [
      {
        "text": "สวัสดี",
        "language": "Thai",
        "fromIso2": "th",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 1,
    "language": "Mandarin Chinese",
    "pronunciation": "nee how"
  },
  {
    "id": "hello-in",
    "iso2": "in",
    "prompt": "This is how people say hello in India (Hindi). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "สวัสดี",
        "language": "Thai",
        "fromIso2": "th",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5"
      }
    ],
    "correctIndex": 0,
    "language": "Hindi",
    "pronunciation": "nuh-muh-STAY"
  },
  {
    "id": "hello-th",
    "iso2": "th",
    "prompt": "This is how people say hello in Thailand (Thai). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "สวัสดี",
        "language": "Thai",
        "fromIso2": "th",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5"
      }
    ],
    "correctIndex": 3,
    "language": "Thai",
    "pronunciation": "sah-wat-DEE"
  },
  {
    "id": "hello-kr",
    "iso2": "kr",
    "prompt": "This is how people say hello in South Korea (Korean). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "안녕하세요",
        "language": "Korean",
        "fromIso2": "kr",
        "sourceUrl": "https://en.wiktionary.org/wiki/%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Korean",
    "pronunciation": "an-nyong-ha-seh-YOH"
  },
  {
    "id": "hello-vn",
    "iso2": "vn",
    "prompt": "This is how people say hello in Vietnam (Vietnamese). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Xin chào",
        "language": "Vietnamese",
        "fromIso2": "vn",
        "sourceUrl": "https://en.wiktionary.org/wiki/xin%20ch%C3%A0o"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Vietnamese",
    "pronunciation": "sin chow"
  },
  {
    "id": "hello-id",
    "iso2": "id",
    "prompt": "This is how people say hello in Indonesia (Indonesian). Choose the greeting.",
    "options": [
      {
        "text": "Halo",
        "language": "Indonesian",
        "fromIso2": "id",
        "sourceUrl": "https://en.wiktionary.org/wiki/halo"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 0,
    "language": "Indonesian",
    "pronunciation": "HAH-loh"
  },
  {
    "id": "hello-ph",
    "iso2": "ph",
    "prompt": "This is how people say hello in Philippines (Filipino). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Kumusta",
        "language": "Filipino",
        "fromIso2": "ph",
        "sourceUrl": "https://en.wiktionary.org/wiki/kumusta"
      }
    ],
    "correctIndex": 3,
    "language": "Filipino",
    "pronunciation": "koo-moos-TAH"
  },
  {
    "id": "hello-my",
    "iso2": "my",
    "prompt": "This is how people say hello in Malaysia (Malay). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Helo",
        "language": "Malay",
        "fromIso2": "my",
        "sourceUrl": "https://en.wiktionary.org/wiki/helo"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Malay",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-tr",
    "iso2": "tr",
    "prompt": "This is how people say hello in Turkey (Turkish). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Merhaba",
        "language": "Turkish",
        "fromIso2": "tr",
        "sourceUrl": "https://en.wiktionary.org/wiki/merhaba"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Turkish",
    "pronunciation": "MEHR-hah-bah"
  },
  {
    "id": "hello-sa",
    "iso2": "sa",
    "prompt": "This is how people say hello in Saudi Arabia (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "sa",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 0,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-ae",
    "iso2": "ae",
    "prompt": "This is how people say hello in United Arab Emirates (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "ae",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 3,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-pk",
    "iso2": "pk",
    "prompt": "This is how people say hello in Pakistan (Urdu). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "السلام علیکم",
        "language": "Urdu",
        "fromIso2": "pk",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%DB%8C%DA%A9%D9%85"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Urdu",
    "pronunciation": "ah-sah-LAH-moo ah-LAY-koom"
  },
  {
    "id": "hello-bd",
    "iso2": "bd",
    "prompt": "This is how people say hello in Bangladesh (Bengali). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "নমস্কার",
        "language": "Bengali",
        "fromIso2": "bd",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A6%A8%E0%A6%AE%E0%A6%B8%E0%A7%8D%E0%A6%95%E0%A6%BE%E0%A6%B0"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Bengali",
    "pronunciation": "noh-mosh-KAR"
  },
  {
    "id": "hello-np",
    "iso2": "np",
    "prompt": "This is how people say hello in Nepal (Nepali). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Nepali",
        "fromIso2": "np",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "สวัสดี",
        "language": "Thai",
        "fromIso2": "th",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5"
      }
    ],
    "correctIndex": 0,
    "language": "Nepali",
    "pronunciation": "nuh-muh-STAY"
  },
  {
    "id": "hello-lk",
    "iso2": "lk",
    "prompt": "This is how people say hello in Sri Lanka (Sinhala). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "ආයුබෝවන්",
        "language": "Sinhala",
        "fromIso2": "lk",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%B6%86%E0%B6%BA%E0%B7%94%E0%B6%B6%E0%B7%9D%E0%B7%80%E0%B6%B1%E0%B7%8A"
      }
    ],
    "correctIndex": 3,
    "language": "Sinhala",
    "pronunciation": "ah-yoo-BOH-wan"
  },
  {
    "id": "hello-mn",
    "iso2": "mn",
    "prompt": "This is how people say hello in Mongolia (Mongolian). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Сайн байна уу",
        "language": "Mongolian",
        "fromIso2": "mn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D1%81%D0%B0%D0%B9%D0%BD%20%D0%B1%D0%B0%D0%B9%D0%BD%D0%B0%20%D1%83%D1%83"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Mongolian",
    "pronunciation": "sain bain OO"
  },
  {
    "id": "hello-kh",
    "iso2": "kh",
    "prompt": "This is how people say hello in Cambodia (Khmer). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "សួស្តី",
        "language": "Khmer",
        "fromIso2": "kh",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E1%9E%9F%E1%9E%BD%E1%9E%9F%E1%9F%92%E1%9E%8F%E1%9E%B8"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Khmer",
    "pronunciation": "soo-oh-suh-DAY"
  },
  {
    "id": "hello-la",
    "iso2": "la",
    "prompt": "This is how people say hello in Laos (Lao). Choose the greeting.",
    "options": [
      {
        "text": "ສະບາຍດີ",
        "language": "Lao",
        "fromIso2": "la",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%BA%AA%E0%BA%B0%E0%BA%9A%E0%BA%B2%E0%BA%8D%E0%BA%94%E0%BA%B5"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 0,
    "language": "Lao",
    "pronunciation": "sah-bai-DEE"
  },
  {
    "id": "hello-mm",
    "iso2": "mm",
    "prompt": "This is how people say hello in Myanmar (Burmese). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "မင်္ဂလာပါ",
        "language": "Burmese",
        "fromIso2": "mm",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E1%80%99%E1%80%84%E1%80%BA%E1%80%B9%E1%80%82%E1%80%9C%E1%80%AC%E1%80%95%E1%80%AB"
      }
    ],
    "correctIndex": 3,
    "language": "Burmese",
    "pronunciation": "min-gah-LAH-bah"
  },
  {
    "id": "hello-ir",
    "iso2": "ir",
    "prompt": "This is how people say hello in Iran (Persian). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "سلام",
        "language": "Persian",
        "fromIso2": "ir",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D8%B3%D9%84%D8%A7%D9%85"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Persian",
    "pronunciation": "sah-LAHM"
  },
  {
    "id": "hello-iq",
    "iso2": "iq",
    "prompt": "This is how people say hello in Iraq (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "iq",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-il",
    "iso2": "il",
    "prompt": "This is how people say hello in Israel (Hebrew). Choose the greeting.",
    "options": [
      {
        "text": "שלום",
        "language": "Hebrew",
        "fromIso2": "il",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D7%A9%D7%9C%D7%95%D7%9D"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 0,
    "language": "Hebrew",
    "pronunciation": "shah-LOHM"
  },
  {
    "id": "hello-jo",
    "iso2": "jo",
    "prompt": "This is how people say hello in Jordan (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "jo",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      }
    ],
    "correctIndex": 3,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-qa",
    "iso2": "qa",
    "prompt": "This is how people say hello in Qatar (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "qa",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-kw",
    "iso2": "kw",
    "prompt": "This is how people say hello in Kuwait (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "kw",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-om",
    "iso2": "om",
    "prompt": "This is how people say hello in Oman (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "om",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 0,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-kz",
    "iso2": "kz",
    "prompt": "This is how people say hello in Kazakhstan (Kazakh). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Сәлем",
        "language": "Kazakh",
        "fromIso2": "kz",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D1%81%D3%99%D0%BB%D0%B5%D0%BC"
      }
    ],
    "correctIndex": 3,
    "language": "Kazakh",
    "pronunciation": "sah-LEM"
  },
  {
    "id": "hello-uz",
    "iso2": "uz",
    "prompt": "This is how people say hello in Uzbekistan (Uzbek). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Salom",
        "language": "Uzbek",
        "fromIso2": "uz",
        "sourceUrl": "https://en.wiktionary.org/wiki/salom"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Uzbek",
    "pronunciation": "sah-LOM"
  },
  {
    "id": "hello-af",
    "iso2": "af",
    "prompt": "This is how people say hello in Afghanistan (Dari). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "سلام",
        "language": "Dari",
        "fromIso2": "af",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D8%B3%D9%84%D8%A7%D9%85"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Dari",
    "pronunciation": "sah-LAHM"
  },
  {
    "id": "hello-bt",
    "iso2": "bt",
    "prompt": "This is how people say hello in Bhutan (Dzongkha). Choose the greeting.",
    "options": [
      {
        "text": "སྐུ་གཟུགས་བཟང་པོ།",
        "language": "Dzongkha",
        "fromIso2": "bt",
        "sourceUrl": "https://bhutan.travel/visit"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 0,
    "language": "Dzongkha",
    "pronunciation": "koo-zoo-ZANG-poh"
  },
  {
    "id": "hello-bn",
    "iso2": "bn",
    "prompt": "This is how people say hello in Brunei (Malay). Choose the greeting.",
    "options": [
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "Helo",
        "language": "Malay",
        "fromIso2": "bn",
        "sourceUrl": "https://en.wiktionary.org/wiki/helo"
      }
    ],
    "correctIndex": 3,
    "language": "Malay",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-lb",
    "iso2": "lb",
    "prompt": "This is how people say hello in Lebanon (Arabic). Choose the greeting.",
    "options": [
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "مرحبا",
        "language": "Arabic",
        "fromIso2": "lb",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D9%85%D8%B1%D8%AD%D8%A8%D8%A7"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      }
    ],
    "correctIndex": 2,
    "language": "Arabic",
    "pronunciation": "MAR-ha-ban"
  },
  {
    "id": "hello-ge",
    "iso2": "ge",
    "prompt": "This is how people say hello in Georgia (Georgian). Choose the greeting.",
    "options": [
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      },
      {
        "text": "გამარჯობა",
        "language": "Georgian",
        "fromIso2": "ge",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E1%83%92%E1%83%90%E1%83%9B%E1%83%90%E1%83%A0%E1%83%AF%E1%83%9D%E1%83%91%E1%83%90"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      }
    ],
    "correctIndex": 1,
    "language": "Georgian",
    "pronunciation": "gah-mar-JOH-bah"
  },
  {
    "id": "hello-am",
    "iso2": "am",
    "prompt": "This is how people say hello in Armenia (Armenian). Choose the greeting.",
    "options": [
      {
        "text": "Բարև",
        "language": "Armenian",
        "fromIso2": "am",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D5%A2%D5%A1%D6%80%D6%87"
      },
      {
        "text": "こんにちは",
        "language": "Japanese",
        "fromIso2": "jp",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
      },
      {
        "text": "你好",
        "language": "Mandarin Chinese",
        "fromIso2": "cn",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E4%BD%A0%E5%A5%BD"
      },
      {
        "text": "नमस्ते",
        "language": "Hindi",
        "fromIso2": "in",
        "sourceUrl": "https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87"
      }
    ],
    "correctIndex": 0,
    "language": "Armenian",
    "pronunciation": "bah-REV"
  },
  {
    "id": "hello-fr",
    "iso2": "fr",
    "prompt": "This is how people say hello in France (French). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "es",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 3,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-de",
    "iso2": "de",
    "prompt": "This is how people say hello in Germany (German). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "es",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "German",
    "pronunciation": "GOO-ten tahk"
  },
  {
    "id": "hello-it",
    "iso2": "it",
    "prompt": "This is how people say hello in Italy (Italian). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "es",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Italian",
    "pronunciation": "chow"
  },
  {
    "id": "hello-es",
    "iso2": "es",
    "prompt": "This is how people say hello in Spain (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "es",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-gb",
    "iso2": "gb",
    "prompt": "This is how people say hello in United Kingdom (English). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gb",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 3,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-ru",
    "iso2": "ru",
    "prompt": "This is how people say hello in Russia (Russian). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Здравствуйте",
        "language": "Russian",
        "fromIso2": "ru",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Russian",
    "pronunciation": "ZDRAST-vooy-tyeh"
  },
  {
    "id": "hello-gr",
    "iso2": "gr",
    "prompt": "This is how people say hello in Greece (Greek). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Γεια σου",
        "language": "Greek",
        "fromIso2": "gr",
        "sourceUrl": "https://en.wiktionary.org/wiki/%CE%B3%CE%B5%CE%B9%CE%B1%20%CF%83%CE%BF%CF%85"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Greek",
    "pronunciation": "yah soo"
  },
  {
    "id": "hello-pt",
    "iso2": "pt",
    "prompt": "This is how people say hello in Portugal (Portuguese). Choose the greeting.",
    "options": [
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "pt",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Portuguese",
    "pronunciation": "oh-LAH"
  },
  {
    "id": "hello-nl",
    "iso2": "nl",
    "prompt": "This is how people say hello in Netherlands (Dutch). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hallo",
        "language": "Dutch",
        "fromIso2": "nl",
        "sourceUrl": "https://en.wiktionary.org/wiki/hallo"
      }
    ],
    "correctIndex": 3,
    "language": "Dutch",
    "pronunciation": "HAH-loh"
  },
  {
    "id": "hello-ch",
    "iso2": "ch",
    "prompt": "This is how people say hello in Switzerland (Swiss German). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "es",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Grüezi",
        "language": "Swiss German",
        "fromIso2": "ch",
        "sourceUrl": "https://en.wiktionary.org/wiki/gr%C3%BCezi"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Swiss German",
    "pronunciation": "GROO-et-see"
  },
  {
    "id": "hello-se",
    "iso2": "se",
    "prompt": "This is how people say hello in Sweden (Swedish). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hej",
        "language": "Swedish",
        "fromIso2": "se",
        "sourceUrl": "https://en.wiktionary.org/wiki/hej"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Swedish",
    "pronunciation": "hay"
  },
  {
    "id": "hello-no",
    "iso2": "no",
    "prompt": "This is how people say hello in Norway (Norwegian). Choose the greeting.",
    "options": [
      {
        "text": "Hei",
        "language": "Norwegian",
        "fromIso2": "no",
        "sourceUrl": "https://en.wiktionary.org/wiki/hei"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Norwegian",
    "pronunciation": "hay"
  },
  {
    "id": "hello-fi",
    "iso2": "fi",
    "prompt": "This is how people say hello in Finland (Finnish). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hei",
        "language": "Finnish",
        "fromIso2": "fi",
        "sourceUrl": "https://en.wiktionary.org/wiki/hei"
      }
    ],
    "correctIndex": 3,
    "language": "Finnish",
    "pronunciation": "hay"
  },
  {
    "id": "hello-dk",
    "iso2": "dk",
    "prompt": "This is how people say hello in Denmark (Danish). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hej",
        "language": "Danish",
        "fromIso2": "dk",
        "sourceUrl": "https://en.wiktionary.org/wiki/hej"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Danish",
    "pronunciation": "hi"
  },
  {
    "id": "hello-ie",
    "iso2": "ie",
    "prompt": "This is how people say hello in Ireland (English). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "ie",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-pl",
    "iso2": "pl",
    "prompt": "This is how people say hello in Poland (Polish). Choose the greeting.",
    "options": [
      {
        "text": "Cześć",
        "language": "Polish",
        "fromIso2": "pl",
        "sourceUrl": "https://en.wiktionary.org/wiki/cze%C5%9B%C4%87"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Polish",
    "pronunciation": "cheshch"
  },
  {
    "id": "hello-at",
    "iso2": "at",
    "prompt": "This is how people say hello in Austria (German). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "es",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "at",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 3,
    "language": "German",
    "pronunciation": "GOO-ten tahk"
  },
  {
    "id": "hello-be",
    "iso2": "be",
    "prompt": "This is how people say hello in Belgium (Dutch). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Hallo",
        "language": "Dutch",
        "fromIso2": "be",
        "sourceUrl": "https://en.wiktionary.org/wiki/hallo"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Dutch",
    "pronunciation": "HAH-loh"
  },
  {
    "id": "hello-ua",
    "iso2": "ua",
    "prompt": "This is how people say hello in Ukraine (Ukrainian). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Вітаю",
        "language": "Ukrainian",
        "fromIso2": "ua",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B2%D1%96%D1%82%D0%B0%D1%8E"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Ukrainian",
    "pronunciation": "vee-TAH-yoo"
  },
  {
    "id": "hello-is",
    "iso2": "is",
    "prompt": "This is how people say hello in Iceland (Icelandic). Choose the greeting.",
    "options": [
      {
        "text": "Halló",
        "language": "Icelandic",
        "fromIso2": "is",
        "sourceUrl": "https://en.wiktionary.org/wiki/hall%C3%B3"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Icelandic",
    "pronunciation": "HAH-loh"
  },
  {
    "id": "hello-cz",
    "iso2": "cz",
    "prompt": "This is how people say hello in Czechia (Czech). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Ahoj",
        "language": "Czech",
        "fromIso2": "cz",
        "sourceUrl": "https://en.wiktionary.org/wiki/ahoj"
      }
    ],
    "correctIndex": 3,
    "language": "Czech",
    "pronunciation": "ah-HOY"
  },
  {
    "id": "hello-hu",
    "iso2": "hu",
    "prompt": "This is how people say hello in Hungary (Hungarian). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Szia",
        "language": "Hungarian",
        "fromIso2": "hu",
        "sourceUrl": "https://en.wiktionary.org/wiki/szia"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Hungarian",
    "pronunciation": "SEE-ah"
  },
  {
    "id": "hello-ro",
    "iso2": "ro",
    "prompt": "This is how people say hello in Romania (Romanian). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Bună",
        "language": "Romanian",
        "fromIso2": "ro",
        "sourceUrl": "https://en.wiktionary.org/wiki/bun%C4%83"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Romanian",
    "pronunciation": "BOO-nuh"
  },
  {
    "id": "hello-bg",
    "iso2": "bg",
    "prompt": "This is how people say hello in Bulgaria (Bulgarian). Choose the greeting.",
    "options": [
      {
        "text": "Здравей",
        "language": "Bulgarian",
        "fromIso2": "bg",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D0%B5%D0%B9"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Bulgarian",
    "pronunciation": "zdrah-VEY"
  },
  {
    "id": "hello-hr",
    "iso2": "hr",
    "prompt": "This is how people say hello in Croatia (Croatian). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Bok",
        "language": "Croatian",
        "fromIso2": "hr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bok"
      }
    ],
    "correctIndex": 3,
    "language": "Croatian",
    "pronunciation": "bok"
  },
  {
    "id": "hello-rs",
    "iso2": "rs",
    "prompt": "This is how people say hello in Serbia (Serbian). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Здраво",
        "language": "Serbian",
        "fromIso2": "rs",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D0%B7%D0%B4%D1%80%D0%B0%D0%B2%D0%BE"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Serbian",
    "pronunciation": "ZDRAH-voh"
  },
  {
    "id": "hello-sk",
    "iso2": "sk",
    "prompt": "This is how people say hello in Slovakia (Slovak). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Ahoj",
        "language": "Slovak",
        "fromIso2": "sk",
        "sourceUrl": "https://en.wiktionary.org/wiki/ahoj"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Slovak",
    "pronunciation": "ah-HOY"
  },
  {
    "id": "hello-si",
    "iso2": "si",
    "prompt": "This is how people say hello in Slovenia (Slovenian). Choose the greeting.",
    "options": [
      {
        "text": "Živjo",
        "language": "Slovenian",
        "fromIso2": "si",
        "sourceUrl": "https://en.wiktionary.org/wiki/%C5%BEivjo"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Slovenian",
    "pronunciation": "ZHEEV-yoh"
  },
  {
    "id": "hello-lt",
    "iso2": "lt",
    "prompt": "This is how people say hello in Lithuania (Lithuanian). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Labas",
        "language": "Lithuanian",
        "fromIso2": "lt",
        "sourceUrl": "https://en.wiktionary.org/wiki/labas"
      }
    ],
    "correctIndex": 3,
    "language": "Lithuanian",
    "pronunciation": "LAH-bahs"
  },
  {
    "id": "hello-lv",
    "iso2": "lv",
    "prompt": "This is how people say hello in Latvia (Latvian). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Sveiki",
        "language": "Latvian",
        "fromIso2": "lv",
        "sourceUrl": "https://en.wiktionary.org/wiki/sveiki"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Latvian",
    "pronunciation": "SVAY-kee"
  },
  {
    "id": "hello-ee",
    "iso2": "ee",
    "prompt": "This is how people say hello in Estonia (Estonian). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Tere",
        "language": "Estonian",
        "fromIso2": "ee",
        "sourceUrl": "https://en.wiktionary.org/wiki/tere"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Estonian",
    "pronunciation": "TEH-reh"
  },
  {
    "id": "hello-al",
    "iso2": "al",
    "prompt": "This is how people say hello in Albania (Albanian). Choose the greeting.",
    "options": [
      {
        "text": "Përshëndetje",
        "language": "Albanian",
        "fromIso2": "al",
        "sourceUrl": "https://en.wiktionary.org/wiki/p%C3%ABrsh%C3%ABndetje"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      }
    ],
    "correctIndex": 0,
    "language": "Albanian",
    "pronunciation": "per-shen-DET-yeh"
  },
  {
    "id": "hello-by",
    "iso2": "by",
    "prompt": "This is how people say hello in Belarus (Belarusian). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Прывітанне",
        "language": "Belarusian",
        "fromIso2": "by",
        "sourceUrl": "https://en.wiktionary.org/wiki/%D0%BF%D1%80%D1%8B%D0%B2%D1%96%D1%82%D0%B0%D0%BD%D0%BD%D0%B5"
      }
    ],
    "correctIndex": 3,
    "language": "Belarusian",
    "pronunciation": "prih-vee-TAHN-nyeh"
  },
  {
    "id": "hello-lu",
    "iso2": "lu",
    "prompt": "This is how people say hello in Luxembourg (Luxembourgish). Choose the greeting.",
    "options": [
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      },
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Moien",
        "language": "Luxembourgish",
        "fromIso2": "lu",
        "sourceUrl": "https://en.wiktionary.org/wiki/moien"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "Luxembourgish",
    "pronunciation": "MOY-en"
  },
  {
    "id": "hello-cy",
    "iso2": "cy",
    "prompt": "This is how people say hello in Cyprus (Greek). Choose the greeting.",
    "options": [
      {
        "text": "Ciao",
        "language": "Italian",
        "fromIso2": "it",
        "sourceUrl": "https://en.wiktionary.org/wiki/ciao"
      },
      {
        "text": "Γεια σου",
        "language": "Greek",
        "fromIso2": "cy",
        "sourceUrl": "https://en.wiktionary.org/wiki/%CE%B3%CE%B5%CE%B9%CE%B1%20%CF%83%CE%BF%CF%85"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "fr",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Guten Tag",
        "language": "German",
        "fromIso2": "de",
        "sourceUrl": "https://en.wiktionary.org/wiki/guten%20Tag"
      }
    ],
    "correctIndex": 1,
    "language": "Greek",
    "pronunciation": "yah soo"
  },
  {
    "id": "hello-us",
    "iso2": "us",
    "prompt": "This is how people say hello in United States (English). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "mx",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      }
    ],
    "correctIndex": 0,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-ca",
    "iso2": "ca",
    "prompt": "This is how people say hello in Canada (French). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "mx",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 3,
    "language": "French",
    "pronunciation": "bon-ZHOOR"
  },
  {
    "id": "hello-mx",
    "iso2": "mx",
    "prompt": "This is how people say hello in Mexico (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "mx",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 2,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-cu",
    "iso2": "cu",
    "prompt": "This is how people say hello in Cuba (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "cu",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 1,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-jm",
    "iso2": "jm",
    "prompt": "This is how people say hello in Jamaica (English). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "jm",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "mx",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      }
    ],
    "correctIndex": 0,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-cr",
    "iso2": "cr",
    "prompt": "This is how people say hello in Costa Rica (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "cr",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      }
    ],
    "correctIndex": 3,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-pa",
    "iso2": "pa",
    "prompt": "This is how people say hello in Panama (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "pa",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 2,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-gt",
    "iso2": "gt",
    "prompt": "This is how people say hello in Guatemala (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "gt",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 1,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-hn",
    "iso2": "hn",
    "prompt": "This is how people say hello in Honduras (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "hn",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      }
    ],
    "correctIndex": 0,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-ni",
    "iso2": "ni",
    "prompt": "This is how people say hello in Nicaragua (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "ni",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      }
    ],
    "correctIndex": 3,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-sv",
    "iso2": "sv",
    "prompt": "This is how people say hello in El Salvador (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "sv",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 2,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-ht",
    "iso2": "ht",
    "prompt": "This is how people say hello in Haiti (Haitian Creole). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "mx",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 1,
    "language": "Haitian Creole",
    "pronunciation": "bon-ZHOO"
  },
  {
    "id": "hello-do",
    "iso2": "do",
    "prompt": "This is how people say hello in Dominican Republic (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "do",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "us",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      }
    ],
    "correctIndex": 0,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-bs",
    "iso2": "bs",
    "prompt": "This is how people say hello in Bahamas (English). Choose the greeting.",
    "options": [
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "mx",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "bs",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 3,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-bz",
    "iso2": "bz",
    "prompt": "This is how people say hello in Belize (English). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "mx",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Bonjou",
        "language": "Haitian Creole",
        "fromIso2": "ht",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjou"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "bz",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Bonjour",
        "language": "French",
        "fromIso2": "ca",
        "sourceUrl": "https://en.wiktionary.org/wiki/bonjour"
      }
    ],
    "correctIndex": 2,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-br",
    "iso2": "br",
    "prompt": "This is how people say hello in Brazil (Portuguese). Choose the greeting.",
    "options": [
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "ar",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 1,
    "language": "Portuguese",
    "pronunciation": "oh-LAH"
  },
  {
    "id": "hello-ar",
    "iso2": "ar",
    "prompt": "This is how people say hello in Argentina (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "ar",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      }
    ],
    "correctIndex": 0,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-cl",
    "iso2": "cl",
    "prompt": "This is how people say hello in Chile (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "cl",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      }
    ],
    "correctIndex": 3,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-pe",
    "iso2": "pe",
    "prompt": "This is how people say hello in Peru (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "pe",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      }
    ],
    "correctIndex": 2,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-co",
    "iso2": "co",
    "prompt": "This is how people say hello in Colombia (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "co",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 1,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-ve",
    "iso2": "ve",
    "prompt": "This is how people say hello in Venezuela (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "ve",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      }
    ],
    "correctIndex": 0,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-ec",
    "iso2": "ec",
    "prompt": "This is how people say hello in Ecuador (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "ec",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      }
    ],
    "correctIndex": 3,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-bo",
    "iso2": "bo",
    "prompt": "This is how people say hello in Bolivia (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "bo",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      }
    ],
    "correctIndex": 2,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-uy",
    "iso2": "uy",
    "prompt": "This is how people say hello in Uruguay (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "uy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 1,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-py",
    "iso2": "py",
    "prompt": "This is how people say hello in Paraguay (Spanish). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "py",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      }
    ],
    "correctIndex": 0,
    "language": "Spanish",
    "pronunciation": "OH-lah"
  },
  {
    "id": "hello-gy",
    "iso2": "gy",
    "prompt": "This is how people say hello in Guyana (English). Choose the greeting.",
    "options": [
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      },
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "ar",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 3,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-sr",
    "iso2": "sr",
    "prompt": "This is how people say hello in Suriname (Dutch). Choose the greeting.",
    "options": [
      {
        "text": "Hola",
        "language": "Spanish",
        "fromIso2": "ar",
        "sourceUrl": "https://en.wiktionary.org/wiki/hola"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "gy",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Goedendag",
        "language": "Dutch",
        "fromIso2": "sr",
        "sourceUrl": "https://en.wiktionary.org/wiki/goedendag"
      },
      {
        "text": "Olá",
        "language": "Portuguese",
        "fromIso2": "br",
        "sourceUrl": "https://en.wiktionary.org/wiki/ol%C3%A1"
      }
    ],
    "correctIndex": 2,
    "language": "Dutch",
    "pronunciation": "KHOO-den-dakh"
  },
  {
    "id": "hello-au",
    "iso2": "au",
    "prompt": "This is how people say hello in Australia (English). Choose the greeting.",
    "options": [
      {
        "text": "Bula",
        "language": "Fijian",
        "fromIso2": "fj",
        "sourceUrl": "https://en.wiktionary.org/wiki/bula"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "au",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Kia ora",
        "language": "Māori",
        "fromIso2": "nz",
        "sourceUrl": "https://en.wiktionary.org/wiki/kia%20ora"
      },
      {
        "text": "Gude",
        "language": "Tok Pisin",
        "fromIso2": "pg",
        "sourceUrl": "https://en.wiktionary.org/wiki/gude"
      }
    ],
    "correctIndex": 1,
    "language": "English",
    "pronunciation": "heh-LOH"
  },
  {
    "id": "hello-nz",
    "iso2": "nz",
    "prompt": "This is how people say hello in New Zealand (Māori). Choose the greeting.",
    "options": [
      {
        "text": "Kia ora",
        "language": "Māori",
        "fromIso2": "nz",
        "sourceUrl": "https://en.wiktionary.org/wiki/kia%20ora"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "au",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Gude",
        "language": "Tok Pisin",
        "fromIso2": "pg",
        "sourceUrl": "https://en.wiktionary.org/wiki/gude"
      },
      {
        "text": "Bula",
        "language": "Fijian",
        "fromIso2": "fj",
        "sourceUrl": "https://en.wiktionary.org/wiki/bula"
      }
    ],
    "correctIndex": 0,
    "language": "Māori",
    "pronunciation": "kee-ah OH-rah"
  },
  {
    "id": "hello-pg",
    "iso2": "pg",
    "prompt": "This is how people say hello in Papua New Guinea (Tok Pisin). Choose the greeting.",
    "options": [
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "au",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      },
      {
        "text": "Kia ora",
        "language": "Māori",
        "fromIso2": "nz",
        "sourceUrl": "https://en.wiktionary.org/wiki/kia%20ora"
      },
      {
        "text": "Bula",
        "language": "Fijian",
        "fromIso2": "fj",
        "sourceUrl": "https://en.wiktionary.org/wiki/bula"
      },
      {
        "text": "Gude",
        "language": "Tok Pisin",
        "fromIso2": "pg",
        "sourceUrl": "https://en.wiktionary.org/wiki/gude"
      }
    ],
    "correctIndex": 3,
    "language": "Tok Pisin",
    "pronunciation": "goo-DEH"
  },
  {
    "id": "hello-fj",
    "iso2": "fj",
    "prompt": "This is how people say hello in Fiji (Fijian). Choose the greeting.",
    "options": [
      {
        "text": "Kia ora",
        "language": "Māori",
        "fromIso2": "nz",
        "sourceUrl": "https://en.wiktionary.org/wiki/kia%20ora"
      },
      {
        "text": "Gude",
        "language": "Tok Pisin",
        "fromIso2": "pg",
        "sourceUrl": "https://en.wiktionary.org/wiki/gude"
      },
      {
        "text": "Bula",
        "language": "Fijian",
        "fromIso2": "fj",
        "sourceUrl": "https://en.wiktionary.org/wiki/bula"
      },
      {
        "text": "Hello",
        "language": "English",
        "fromIso2": "au",
        "sourceUrl": "https://en.wiktionary.org/wiki/hello"
      }
    ],
    "correctIndex": 2,
    "language": "Fijian",
    "pronunciation": "MBOO-lah"
  }
] as const;
