import { useId, useRef, useState } from "react";

export const DEFAULT_APPEARANCE = {
  skinColor: "#C98F69",
  hairColor: "#30251F",
  outfitColor: "#8C79B8",
  hairstyle: "swept",
  faceShape: "oval",
  accessories: "none",
  eyeColor: "#5C4334",
  eyeShape: "almond",
  eyebrows: "soft",
  expression: "smile",
  facialHair: "none",
  outfitStyle: "hoodie",
  backgroundColor: "#E8E1F3",
  accessoryColor: "#CDA85C",
  backdrop: "halo",
  pose: "relaxed",
};
export const AVATAR_OPTIONS = {
  hairstyle: [
    "swept",
    "curly",
    "spiky",
    "undercut",
    "long",
    "bob",
    "bun",
    "braids",
    "bald",
  ],
  faceShape: ["oval", "round", "square", "heart"],
  accessories: [
    "none",
    "glasses",
    "sunglasses",
    "headphones",
    "chain",
    "earrings",
  ],
  eyeShape: ["almond", "round", "cat"],
  eyebrows: ["soft", "bold", "arched"],
  expression: ["smile", "grin", "calm", "wink"],
  facialHair: ["none", "stubble", "beard", "moustache"],
  outfitStyle: ["hoodie", "tee", "varsity", "knit", "jacket"],
  backdrop: ["halo", "sparkle", "grid"],
  pose: ["relaxed", "wave", "peace"],
};
export function normalizeAppearance(value = {}) {
  const result = { ...DEFAULT_APPEARANCE };
  for (const key of Object.keys(result)) {
    const input = value?.[key];
    if (key.endsWith("Color")) {
      if (typeof input === "string" && /^#[0-9a-f]{6}$/i.test(input))
        result[key] = input;
    } else if (AVATAR_OPTIONS[key]?.includes(input)) result[key] = input;
  }
  return result;
}
function tone(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (value) =>
    Math.max(0, Math.min(255, value + amount))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(n >> 16)}${clamp((n >> 8) & 255)}${clamp(n & 255)}`;
}
const FACE_PATHS = {
  oval: "M240 110C183 110 151 143 153 201L159 252C165 300 199 332 240 338C281 332 315 300 321 252L327 201C329 143 297 110 240 110Z",
  round:
    "M240 113C181 113 145 153 148 215C148 278 180 331 240 334C300 331 332 278 332 215C335 153 299 113 240 113Z",
  square:
    "M240 109C181 109 151 143 153 199L158 270Q162 309 190 326Q212 339 240 338Q269 339 290 326Q318 309 322 270L327 199C329 143 299 109 240 109Z",
  heart:
    "M240 110C178 108 143 148 149 208C153 260 181 303 216 326Q240 347 264 326C299 303 327 260 331 208C337 148 302 108 240 110Z",
};
const BODY =
  "M209 350Q184 358 154 365C112 374 87 398 80 520H400C393 398 368 374 326 365Q296 358 271 350Z";

// Original editable vector artwork: no external avatar service or image downloads.
export function AvatarArtwork({
  appearance = {},
  view = "full",
  transparent = false,
  className = "",
  title = "Your FaceQuest avatar",
}) {
  const a = normalizeAppearance(appearance);
  const id = `fqav-${useId().replace(/[^a-z0-9_-]/gi, "")}`;
  const fill = (name) => `url(#${id}-${name})`;
  const hair = fill("hair"),
    skin = fill("skin"),
    outfit = fill("outfit");
  const hairDark = tone(a.hairColor, -20);
  const ink = "#3A2932";
  const longHair = ["long", "bob", "braids"].includes(a.hairstyle);
  const eyePath =
    a.eyeShape === "round"
      ? "M-22 0Q0-25 22 0Q0 23-22 0Z"
      : a.eyeShape === "cat"
        ? "M-23 1Q0-22 24-4Q6 19-23 1Z"
        : "M-23 0Q0-21 24 0Q0 17-23 0Z";
  const viewBox =
    view === "head"
      ? "105 25 270 335"
      : view === "outfit"
        ? "90 325 300 195"
        : "0 0 480 520";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={className}
      role="img"
      aria-labelledby={`${id}-title`}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor={tone(a.skinColor, 20)} />
          <stop offset=".6" stopColor={a.skinColor} />
          <stop offset="1" stopColor={tone(a.skinColor, -18)} />
        </linearGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2=".75" y2="1">
          <stop stopColor={tone(a.hairColor, 22)} />
          <stop offset=".55" stopColor={a.hairColor} />
          <stop offset="1" stopColor={hairDark} />
        </linearGradient>
        <linearGradient id={`${id}-outfit`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={tone(a.outfitColor, 17)} />
          <stop offset="1" stopColor={tone(a.outfitColor, -18)} />
        </linearGradient>
        <linearGradient id={`${id}-gold`}>
          <stop stopColor={tone(a.accessoryColor, 25)} />
          <stop offset=".5" stopColor={a.accessoryColor} />
          <stop offset="1" stopColor={tone(a.accessoryColor, -25)} />
        </linearGradient>
        <linearGradient id={`${id}-lens`} x2="0" y2="1">
          <stop stopColor="#665677" />
          <stop offset="1" stopColor="#22202D" />
        </linearGradient>
        <clipPath id={`${id}-body`}>
          <path d={BODY} />
        </clipPath>
        <filter
          id={`${id}-sticker`}
          x="-25%"
          y="-20%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="3.5"
            result="edge"
          />
          <feFlood floodColor="#fff" result="white" />
          <feComposite in="white" in2="edge" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {!transparent && (
        <g data-avatar-background="true">
          <rect width="480" height="520" rx="38" fill={a.backgroundColor} />
          {a.backdrop === "halo" && (
            <>
              <circle cx="240" cy="252" r="185" fill="#fff" opacity=".38" />
              <circle
                cx="240"
                cy="252"
                r="165"
                fill="none"
                stroke="#fff"
                strokeWidth="1.5"
                opacity=".7"
              />
              <circle
                cx="240"
                cy="252"
                r="213"
                fill="none"
                stroke="#fff"
                opacity=".5"
              />
            </>
          )}
          {a.backdrop === "sparkle" && (
            <>
              {[
                [80, 110, 1],
                [389, 180, 0.8],
                [91, 340, 0.7],
                [380, 80, 0.55],
                [410, 390, 0.6],
              ].map(([x, y, s], i) => (
                <path
                  key={i}
                  d="M0-17Q3-3 17 0Q3 3 0 17Q-3 3-17 0Q-3-3 0-17Z"
                  transform={`translate(${x} ${y}) scale(${s})`}
                  fill="#fff"
                  opacity=".85"
                />
              ))}
              <circle cx="106" cy="207" r="5" fill="#fff" opacity=".6" />
              <circle cx="369" cy="308" r="4" fill="#fff" opacity=".6" />
            </>
          )}
          {a.backdrop === "grid" && (
            <g stroke="#fff" opacity=".38">
              {Array.from({ length: 11 }, (_, i) => (
                <g key={i}>
                  <path d={`M${i * 48} 0V520`} />
                  <path d={`M0 ${i * 48}H480`} />
                </g>
              ))}
            </g>
          )}
        </g>
      )}
      <g filter={fill("sticker")}>
        {longHair && a.hairstyle !== "braids" && (
          <path
            d={
              a.hairstyle === "bob"
                ? "M135 239C112 115 155 74 240 76C326 74 370 119 347 255L337 352Q302 376 273 348H188Q145 370 137 345Z"
                : "M130 249C111 126 145 76 237 72C333 66 370 123 350 252L365 436Q321 467 278 430H194Q155 468 115 439Z"
            }
            fill={hair}
          />
        )}
        {a.hairstyle === "bun" && (
          <g>
            <circle cx="254" cy="78" r="43" fill={hair} />
            <path
              d="M228 54Q267 27 280 75M227 67Q260 45 287 86"
              fill="none"
              stroke={tone(a.hairColor, 38)}
              strokeWidth="3"
              opacity=".5"
            />
          </g>
        )}
        {a.accessories === "headphones" && (
          <path
            d="M130 231V188a110 110 0 0 1 220 0v43"
            fill="none"
            stroke="#39303E"
            strokeWidth="15"
          />
        )}
        <path d={BODY} fill={outfit} />
        <g clipPath={fill("body")}>
          <path
            d="M128 389L156 520M352 389L324 520"
            stroke={tone(a.outfitColor, -28)}
            strokeWidth="2"
            opacity=".25"
          />
          {a.outfitStyle === "varsity" && (
            <>
              <path d="M155 365Q110 370 80 520H159L174 383Z" fill="#F3E9D8" />
              <path d="M325 365Q370 370 400 520H321L306 383Z" fill="#F3E9D8" />
              <path d="M240 377V520" stroke="#E7DBCB" strokeWidth="6" />
              {[411, 445, 479, 513].map((y) => (
                <circle key={y} cx="240" cy={y} r="3.5" fill="#F5EAD7" />
              ))}
              <text
                x="273"
                y="434"
                fontFamily="Arial,sans-serif"
                fontWeight="900"
                fontSize="41"
                fill="#F3E9D8"
              >
                F
              </text>
              <path
                d="M97 498H385"
                stroke="#fff"
                strokeWidth="4"
                opacity=".2"
              />
            </>
          )}
          {a.outfitStyle === "knit" && (
            <g stroke={tone(a.outfitColor, -30)} strokeWidth="1" opacity=".18">
              {Array.from({ length: 12 }, (_, i) => (
                <path key={i} d={`M${110 + i * 24} 387V530`} />
              ))}
              {Array.from({ length: 8 }, (_, i) => (
                <path key={`h${i}`} d={`M80 ${410 + i * 15}H400`} />
              ))}
            </g>
          )}
          {a.outfitStyle === "jacket" && (
            <>
              <path d="M215 365L231 390V520H253V390L269 365Z" fill="#F4ECDC" />
              <path d="M240 395V520" stroke="#6B6175" strokeWidth="3" />
              <path
                d="M139 452l58-8M284 444l57 8"
                stroke={tone(a.outfitColor, -35)}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          )}
        </g>
        <path
          d="M211 304V358Q210 383 240 388Q270 383 269 358V304Z"
          fill={tone(a.skinColor, -14)}
        />
        <path
          d="M214 324Q240 345 266 324V352Q240 368 214 352Z"
          fill={a.skinColor}
        />
        {a.outfitStyle === "tee" && (
          <path
            d="M201 354Q240 401 279 354L290 363Q241 422 190 363Z"
            fill={tone(a.outfitColor, -20)}
          />
        )}
        {a.outfitStyle === "hoodie" && (
          <>
            <path
              d="M210 351Q179 344 168 366L193 399Q215 391 224 379Z"
              fill={tone(a.outfitColor, 14)}
            />
            <path
              d="M270 351Q301 344 312 366L287 399Q265 391 256 379Z"
              fill={tone(a.outfitColor, 9)}
            />
            <path
              d="M225 390L221 444M255 390L259 444"
              stroke="#F3EEDF"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M188 467Q240 449 292 467L281 497H199Z"
              fill={tone(a.outfitColor, -18)}
              opacity=".65"
            />
            <path
              d="M210 471v20M270 471v20"
              stroke={tone(a.outfitColor, -38)}
              strokeWidth="2"
              opacity=".4"
            />
          </>
        )}
        {a.outfitStyle === "knit" && (
          <>
            <path
              d="M205 350Q240 371 275 350L280 386Q240 408 200 386Z"
              fill={tone(a.outfitColor, 10)}
            />
            {[211, 220, 229, 240, 251, 260, 269].map((x) => (
              <path
                key={x}
                d={`M${x} 363v24`}
                stroke={tone(a.outfitColor, -28)}
                opacity=".35"
              />
            ))}
          </>
        )}
        {a.outfitStyle === "varsity" && (
          <path
            d="M205 352Q240 391 275 352L282 367Q241 410 198 367Z"
            fill="#F3E9D8"
            stroke={tone(a.outfitColor, -20)}
            strokeWidth="4"
          />
        )}
        {a.outfitStyle === "jacket" && (
          <>
            <path
              d="M207 351L233 393L198 380L181 367Z"
              fill={tone(a.outfitColor, 25)}
            />
            <path
              d="M273 351L247 393L282 380L299 367Z"
              fill={tone(a.outfitColor, 19)}
            />
          </>
        )}
        <g fill={skin} stroke={tone(a.skinColor, -28)} strokeWidth="1.5">
          <ellipse cx="151" cy="232" rx="17" ry="28" />
          <ellipse cx="329" cy="232" rx="17" ry="28" />
        </g>
        <g
          stroke={tone(a.skinColor, -29)}
          strokeWidth="3"
          fill="none"
          opacity=".7"
        >
          <path d="M149 220q-13-2-6 20l8 6M331 220q13-2 6 20l-8 6" />
        </g>
        <path
          d={FACE_PATHS[a.faceShape]}
          fill={skin}
          stroke={tone(a.skinColor, -23)}
          strokeWidth="1.2"
        />
        <path
          d="M174 180Q170 153 191 139"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          opacity=".12"
          strokeLinecap="round"
        />
        {a.facialHair === "beard" && (
          <path
            d="M174 267Q185 294 209 279Q224 267 240 279Q256 267 271 279Q295 292 306 267L302 292Q282 331 240 337Q196 330 178 294Z"
            fill={hair}
          />
        )}
        {a.facialHair === "stubble" && (
          <g fill={a.hairColor} opacity=".28">
            {Array.from({ length: 42 }, (_, i) => {
              const t = (i / 41) * Math.PI;
              return (
                <circle
                  key={i}
                  cx={240 + Math.cos(t) * 58}
                  cy={285 + Math.sin(t) * 39 + (i % 3) * 3}
                  r={0.9 + (i % 2) * 0.35}
                />
              );
            })}
          </g>
        )}
        <ellipse
          cx="194"
          cy="263"
          rx="18"
          ry="9"
          fill="#D67674"
          opacity=".14"
        />
        <ellipse
          cx="286"
          cy="263"
          rx="18"
          ry="9"
          fill="#D67674"
          opacity=".14"
        />
        {[195, 285].map((x, index) => (
          <g key={x} transform={`translate(${x} 221)`}>
            {a.expression === "wink" && index === 1 ? (
              <path
                d="M-22-1Q0 17 22-1"
                stroke={ink}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path
                  d={eyePath}
                  fill="#FFFDF7"
                  stroke={ink}
                  strokeWidth="1.8"
                />
                <ellipse cx="0" cy="0" rx="9.5" ry="11" fill={a.eyeColor} />
                <ellipse cx="0" cy="1" rx="4.7" ry="6.4" fill="#211E26" />
                <circle cx="-3" cy="-4" r="3.1" fill="#fff" />
                <circle cx="3" cy="4" r="1.2" fill="#fff" opacity=".7" />
                <path
                  d={
                    a.eyeShape === "round"
                      ? "M-21-2Q0-22 22-2"
                      : "M-23 0Q0-21 24 0"
                  }
                  stroke={ink}
                  strokeWidth={a.eyeShape === "cat" ? 3.2 : 2.2}
                  fill="none"
                  strokeLinecap="round"
                />
                {a.eyeShape === "cat" && (
                  <path
                    d={index === 0 ? "M-22-1l-7-6" : "M22-1l7-6"}
                    stroke={ink}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}
              </>
            )}
            <path
              d={
                a.eyebrows === "arched"
                  ? "M-23-28Q-3-47 24-31"
                  : a.eyebrows === "bold"
                    ? "M-23-28Q0-39 24-29"
                    : "M-22-29Q0-37 23-29"
              }
              stroke={a.hairColor}
              strokeWidth={
                a.eyebrows === "bold" ? 7 : a.eyebrows === "soft" ? 4 : 3.8
              }
              strokeLinecap="round"
              fill="none"
            />
          </g>
        ))}
        <path
          d="M241 231Q234 251 237 258Q244 264 253 257"
          fill="none"
          stroke={tone(a.skinColor, -32)}
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M244 239l-2 12"
          stroke={tone(a.skinColor, 34)}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {a.expression === "grin" ? (
          <>
            <path
              d="M212 281Q240 292 268 281Q264 314 240 315Q216 314 212 281Z"
              fill="#63393E"
            />
            <path
              d="M216 284Q240 292 264 284L261 295Q240 302 219 295Z"
              fill="#FFFDF1"
            />
            <path
              d="M229 309Q240 303 251 309"
              stroke="#D98B8E"
              strokeWidth="3"
              fill="none"
            />
          </>
        ) : a.expression === "calm" ? (
          <path
            d="M220 291Q240 297 260 291"
            fill="none"
            stroke="#92555A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        ) : (
          <>
            <path
              d={
                a.expression === "wink"
                  ? "M217 286Q239 310 266 282"
                  : "M215 284Q240 308 265 284"
              }
              fill="none"
              stroke="#864B50"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M231 301q9 4 18 0"
              stroke={tone(a.skinColor, 18)}
              strokeWidth="2"
              fill="none"
            />
          </>
        )}
        {a.facialHair === "moustache" && (
          <path
            d="M213 275Q222 259 240 270Q258 259 267 275Q252 286 240 276Q227 286 213 275Z"
            fill={hair}
          />
        )}
        {a.hairstyle !== "bald" && (
          <g fill={hair}>
            {["swept", "spiky", "undercut", "curly"].includes(a.hairstyle) && (
              <path d="M148 220L143 173C134 122 166 84 211 83C233 58 283 69 309 96C341 112 340 163 330 211L317 197L311 161Q285 158 263 130Q224 177 173 174L162 212Z" />
            )}
            {a.hairstyle === "swept" && (
              <>
                <path d="M150 174Q132 116 200 87Q257 52 309 100Q272 152 171 174Z" />
                <path
                  d="M169 144Q221 102 277 101M177 158Q219 126 252 119"
                  fill="none"
                  stroke={tone(a.hairColor, 35)}
                  strokeWidth="3"
                  opacity=".45"
                  strokeLinecap="round"
                />
              </>
            )}
            {a.hairstyle === "undercut" && (
              <>
                <path
                  d="M155 171Q144 128 171 113L171 198L158 217Z"
                  fill={tone(a.hairColor, 16)}
                />
                <path
                  d="M324 170L313 114L309 198L322 216Z"
                  fill={tone(a.hairColor, 16)}
                />
                <path d="M164 141Q146 101 206 79Q267 56 307 103Q266 150 164 153Z" />
                <path
                  d="M174 126Q222 91 276 96"
                  stroke={tone(a.hairColor, 37)}
                  strokeWidth="3"
                  fill="none"
                  opacity=".5"
                />
              </>
            )}
            {a.hairstyle === "spiky" && (
              <path d="M148 177L145 128L163 135L158 84L194 102L207 54L237 89L262 49L278 92L311 70L311 111L337 105L325 184L307 157L274 135L238 153L202 143L171 174Z" />
            )}
            {a.hairstyle === "curly" && (
              <>
                {[
                  [155, 155, 24],
                  [163, 128, 24],
                  [184, 105, 25],
                  [213, 92, 26],
                  [245, 89, 26],
                  [276, 101, 25],
                  [304, 119, 25],
                  [322, 149, 23],
                  [199, 128, 24],
                  [231, 119, 25],
                  [263, 126, 24],
                  [290, 145, 22],
                  [177, 157, 20],
                  [219, 147, 20],
                ].map(([x, y, r], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r={r} />
                    <path
                      d={`M${x - r * 0.35} ${y - r * 0.25}q${r * 0.5} -${r * 0.45} ${r * 0.7} ${r * 0.1}`}
                      stroke={tone(a.hairColor, 32)}
                      strokeWidth="2.6"
                      fill="none"
                      opacity=".45"
                      strokeLinecap="round"
                    />
                  </g>
                ))}
              </>
            )}
            {["long", "bob", "bun", "braids"].includes(a.hairstyle) && (
              <>
                <path d="M144 216C124 147 152 83 235 82C305 69 349 127 331 216L316 194Q308 158 284 149Q259 137 240 115Q218 149 175 162L163 211Z" />
                <path
                  d="M156 158Q182 104 230 101M249 101Q291 102 319 161"
                  stroke={tone(a.hairColor, 32)}
                  strokeWidth="3"
                  fill="none"
                  opacity=".5"
                  strokeLinecap="round"
                />
              </>
            )}
            {a.hairstyle === "long" && (
              <>
                <path d="M153 174Q141 247 157 326L172 436Q196 441 197 419Q172 314 173 213Z" />
                <path d="M327 174Q339 247 323 326L308 436Q284 441 283 419Q308 314 307 213Z" />
                <path
                  d="M160 245Q160 328 180 410M320 245Q320 328 300 410"
                  stroke={tone(a.hairColor, 30)}
                  strokeWidth="3"
                  fill="none"
                  opacity=".35"
                />
              </>
            )}
            {a.hairstyle === "bob" && (
              <>
                <path d="M148 175Q136 250 143 343L176 351Q169 270 172 209Z" />
                <path d="M332 175Q344 250 337 343L304 351Q311 270 308 209Z" />
              </>
            )}
            {a.hairstyle === "braids" &&
              [151, 329].map((x) => (
                <g key={x}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <g key={i}>
                      <ellipse
                        cx={x + (i % 2 ? 4 : -4)}
                        cy={258 + i * 16}
                        rx="12"
                        ry="13"
                        transform={`rotate(${i % 2 ? 25 : -25} ${x} ${258 + i * 16})`}
                        fill={i % 2 ? a.hairColor : hairDark}
                      />
                      <path
                        d={`M${x - 4} ${252 + i * 16}l8 12`}
                        stroke={tone(a.hairColor, 23)}
                        strokeWidth="2"
                        opacity=".6"
                      />
                    </g>
                  ))}
                  <rect
                    x={x - 10}
                    y="410"
                    width="20"
                    height="7"
                    rx="3"
                    fill={a.outfitColor}
                  />
                </g>
              ))}
          </g>
        )}
        {["glasses", "sunglasses"].includes(a.accessories) && (
          <g
            stroke="#3F3447"
            strokeWidth="4"
            fill={a.accessories === "sunglasses" ? fill("lens") : "#fff"}
            fillOpacity={a.accessories === "sunglasses" ? 0.98 : 0.06}
          >
            <rect x="166" y="201" width="58" height="42" rx="14" />
            <rect x="256" y="201" width="58" height="42" rx="14" />
            <path
              d="M224 215q16-9 32 0M166 213l-16-8M314 213l16-8"
              fill="none"
            />
            {a.accessories === "sunglasses" && (
              <g stroke="#fff" strokeWidth="3" opacity=".35">
                <path d="M176 212l13-3M266 212l13-3" />
              </g>
            )}
          </g>
        )}
        {a.accessories === "headphones" && (
          <g fill={a.outfitColor} stroke="#3D3444" strokeWidth="4">
            <rect x="125" y="203" width="26" height="61" rx="12" />
            <rect x="329" y="203" width="26" height="61" rx="12" />
            <path
              d="M137 215v35M343 215v35"
              stroke="#fff"
              opacity=".3"
              strokeWidth="3"
            />
          </g>
        )}
        {a.accessories === "earrings" && (
          <g fill="none" stroke={fill("gold")} strokeWidth="5">
            <ellipse cx="145" cy="259" rx="10" ry="14" />
            <ellipse cx="335" cy="259" rx="10" ry="14" />
          </g>
        )}
        {a.accessories === "chain" && (
          <g fill="none" stroke={fill("gold")} strokeWidth="5">
            <path d="M204 367Q240 444 276 367" />
            <path
              d="M240 409l9 12-9 12-9-12Z"
              fill={fill("gold")}
              strokeWidth="2"
            />
          </g>
        )}
        {a.pose !== "relaxed" && (
          <g transform="rotate(7 370 340)">
            <path
              d="M346 416Q330 376 344 343L378 342Q394 379 380 425Z"
              fill={outfit}
              stroke={tone(a.outfitColor, -25)}
              strokeWidth="1.5"
            />
            <path
              d={
                a.pose === "wave"
                  ? "M350 348L343 316Q340 308 346 305Q352 303 358 313L358 287Q358 279 365 279Q372 280 371 288L371 306L377 278Q379 270 385 272Q391 274 387 283L383 309L390 287Q393 280 399 284Q403 287 399 294L392 321L399 309Q404 304 408 309Q411 313 405 320L391 349Q383 364 368 361Z"
                  : "M351 348L345 325Q342 315 350 312L359 315L355 280Q354 270 361 269Q369 269 369 279L374 306L383 275Q386 267 393 270Q400 273 396 282L387 319Q400 310 404 319L397 341Q388 365 369 362Z"
              }
              fill={skin}
              stroke={tone(a.skinColor, -30)}
              strokeWidth="1.6"
            />
            <path
              d="M356 331Q371 322 382 336M362 350Q366 341 373 338"
              fill="none"
              stroke={tone(a.skinColor, -25)}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
}

export default function AvatarScene({
  appearance = {},
  onAppearanceChange,
  compact = false,
  disabled = false,
}) {
  const svgContainer = useRef(null);
  const [transparent, setTransparent] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const a = normalizeAppearance(appearance);
  async function exportPNG() {
    if (exporting) return;
    setExporting(true);
    setError("");
    let sourceURL;
    try {
      const svg = svgContainer.current?.querySelector("svg")?.cloneNode(true);
      if (!svg) throw new Error("Your avatar is not ready yet.");
      if (transparent) svg.querySelector("[data-avatar-background]")?.remove();
      svg.setAttribute("width", "960");
      svg.setAttribute("height", "1040");
      sourceURL = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: "image/svg+xml;charset=utf-8",
        }),
      );
      const image = new Image();
      image.src = sourceURL;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 1040;
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error("PNG export is unavailable in this browser.");
      context.drawImage(image, 0, 0, 960, 1040);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not export your avatar.");
      const downloadURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadURL;
      link.download = `facequest-${a.expression}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadURL), 1500);
    } catch (err) {
      setError(err.message || "Export failed. Please try again.");
    } finally {
      if (sourceURL) URL.revokeObjectURL(sourceURL);
      setExporting(false);
    }
  }
  return (
    <div className={`fqav-scene ${compact ? "fqav-scene-compact" : ""}`}>
      <div className="fqav-artwork" ref={svgContainer}>
        <AvatarArtwork appearance={a} />
      </div>
      {!compact && (
        <>
          {onAppearanceChange && (
            <div className="fqav-moods" aria-label="Choose an expression">
              {AVATAR_OPTIONS.expression.map((expression) => (
                <button
                  key={expression}
                  type="button"
                  aria-pressed={a.expression === expression}
                  disabled={disabled}
                  onClick={() => onAppearanceChange({ ...a, expression })}
                >
                  {expression === "smile"
                    ? "Good vibes"
                    : expression === "grin"
                      ? "Big mood"
                      : expression === "calm"
                        ? "Low key"
                        : "A little wink"}
                </button>
              ))}
            </div>
          )}
          <div className="fqav-export">
            <label>
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
              />{" "}
              Transparent PNG
            </label>
            <button type="button" onClick={exportPNG} disabled={exporting}>
              {exporting ? "Exporting…" : "↓ Export sticker"}
            </button>
          </div>
          {error && (
            <p className="fqav-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
