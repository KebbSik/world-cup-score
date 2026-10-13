const COUNTRY_CODES: Record<string, string> = {
  Argentina: "ar",
  Australia: "au",
  Belgium: "be",
  Brazil: "br",
  Bulgaria: "bg",
  Chile: "cl",
  China: "cn",
  Colombia: "co",
  Croatia: "hr",
  Denmark: "dk",
  Ecuador: "ec",
  Egypt: "eg",
  Estonia: "ee",
  Finland: "fi",
  France: "fr",
  Germany: "de",
  Greece: "gr",
  India: "in",
  Israel: "il",
  Italy: "it",
  Japan: "jp",
  Kazakhstan: "kz",
  "Korea, Republic of": "kr",
  Latvia: "lv",
  Lithuania: "lt",
  Mexico: "mx",
  Mongolia: "mn",
  Morocco: "ma",
  Netherlands: "nl",
  "Palestine, State of": "ps",
  Peru: "pe",
  Poland: "pl",
  Portugal: "pt",
  Romania: "ro",
  Serbia: "rs",
  Singapore: "sg",
  Spain: "es",
  Sweden: "se",
  Switzerland: "ch",
  Tunisia: "tn",
  Turkey: "tr",
  Ukraine: "ua",
  "United Kingdom": "gb",
  "United States": "us",
  Uruguay: "uy",
  "Venezuela, Bolivarian Republic of": "ve",
};

export function CountryLabel({ country }: { country: string }) {
  const code = COUNTRY_CODES[country];

  return (
    <span className="inline-flex items-center gap-1.5">
      {code ? (
        <img
          src={`https://flagcdn.com/20x15/${code}.png`}
          srcSet={`https://flagcdn.com/40x30/${code}.png 2x`}
          width={20}
          height={15}
          alt=""
          className="h-3.5 w-5 shrink-0 rounded-xs object-cover"
        />
      ) : null}
      <span>{country}</span>
    </span>
  );
}
