import { describe, expect, it } from 'vitest'

import {
  extractSeesaaCardRarities,
  extractSeesaaCustomizationSpecs,
  extractWikiCustomizationSpecs,
  extractGame8SkillCards,
  extractUnlockLevelFromUnlockText,
  inferUnlockSourceFromUnlockText,
  extractUnlockText,
  inferIsUniqueFromUnlockText,
} from '../scripts/lib/parsers'

describe('extractGame8SkillCards', () => {
  it('extracts name, effect, plan and rarity from a skill list row', () => {
    const html = `
      <table>
        <tr>
          <td class="center">
            <a class="a-link" href="https://game8.jp/gakuen-idolmaster/654069">
              <img data-src="https://img.game8.jp/example.png/original" alt="頂点へ画像">
              頂点へ
            </a>
          </td>
          <td>全力値+3<br>パラメータ+10</td>
          <td class="center"><img alt="アノマリーの画像"></td>
          <td class="center"><img alt="SSRの画像"></td>
        </tr>
      </table>
    `

    expect(extractGame8SkillCards(html)).toMatchObject([
      {
        effectText: '全力値+3\nパラメータ+10',
        id: 'g8-654069',
        imageUrl: 'https://img.game8.jp/example.png/original',
        name: '頂点へ',
        plan: 'anomaly',
        rarity: 'SSR',
        sourceUrl: 'https://game8.jp/gakuen-idolmaster/654069',
        tags: ['全力'],
      },
    ])
  })

  it('detects idol-unique unlock conditions', () => {
    const html = `
      <h3 class="a-header--3">受け取ってくれる？の解放条件</h3>
      <table><tr><td>バレ莉波</td></tr></table>
      <p class="a-paragraph">受け取ってくれる？は、「［ハッピーミルフィーユ］姫崎莉波」を編成するとプロデュース中に最初から使用可能です。</p>
      <h2>次の見出し</h2>
    `

    const unlockText = extractUnlockText(html, '受け取ってくれる？')
    expect(inferIsUniqueFromUnlockText(unlockText)).toBe(true)
  })

  it('extracts unlock text from the standard hm_2 section even when the heading markup differs', () => {
    const html = `
      <h3 class="a-header--3" id="hm_2"><span>はげしく<br></span>の解放条件</h3>
      <p class="a-paragraph">はげしくは、プロデュース中にランダムで使えるようになります。</p>
      <h2>次の見出し</h2>
    `

    expect(extractUnlockText(html, 'はげしく')).toContain(
      'プロデュース中にランダムで使えるようになります。',
    )
  })

  it('extracts unlock text when Game8 splits the unlock heading across h3 and paragraph tags', () => {
    const html = `
      <h3 class="a-header--3" id="hm_2">はげしく</h3>
      <p class="a-paragraph">の解放条件</p>
      <div class="align"></div>
      <p class="a-paragraph">はげしく<br>は、プロデュース中にランダムで使えるようになります。</p>
      <h2>次の見出し</h2>
    `

    expect(extractUnlockText(html, 'はげしく')).toContain(
      'プロデュース中にランダムで使えるようになります。',
    )
  })

  it('classifies support-card unlock conditions as non-memory skills', () => {
    const html = `
      <h3 class="a-header--3" id="hm_2">雨宿りのバス停の解放条件</h3>
      <p class="a-paragraph">雨宿りのバス停は、「さみだれ」をサポートカードとして編成することで、プロデュース中のサポートイベント発生後に使えるようになります。</p>
      <h2>次の見出し</h2>
    `

    const unlockText = extractUnlockText(html, '雨宿りのバス停')
    expect(inferUnlockSourceFromUnlockText(unlockText)).toBe('support-event')
  })

  it('extracts producer level from unlock conditions', () => {
    const unlockText =
      '心・技・体は、プロデュースレベルを30レベルにすると入手して、ランダムに使えるようになります。'

    expect(extractUnlockLevelFromUnlockText(unlockText)).toBe(30)
  })

  it('extracts customization slots and tier labels from the wiki table layout', () => {
    const html = `
      <table>
        <tbody>
          <tr>
            <td>スキル名</td><td>強化上限</td>
            <td>強化枠A</td><td>消費P</td><td>A-①</td><td>消費P</td><td>A-②</td><td>消費P</td><td>A-③</td>
            <td>強化枠B</td><td>消費P</td><td>B-①</td><td>消費P</td><td>B-②</td><td>消費P</td><td>B-③</td>
            <td>強化枠C</td><td>消費P</td><td>C-①</td><td>消費P</td><td>C-②</td><td>消費P</td><td>C-③</td>
          </tr>
          <tr>
            <td>勢い任せ</td><td>3</td>
            <td>バフ</td><td>40</td><td>好調状態の場合、集中5</td><td>40</td><td>好調状態の場合、集中6</td><td>70</td><td>好調状態の場合、集中8</td>
            <td>パラメータ</td><td>100</td><td>パラメータ上昇回数+1</td><td></td><td></td><td></td><td></td>
            <td>パラメータ</td><td>40</td><td>12</td><td>40</td><td>15</td><td>70</td><td>24</td>
          </tr>
          <tr>
            <td>シュプレヒコール</td><td>1</td>
            <td>コスト</td><td>40</td><td>集中消費1</td><td></td><td></td><td></td><td></td>
            <td>効果</td><td>70</td><td>手札をすべてレッスン中強化</td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
          </tr>
          <tr>
            <td>心・技・体</td><td>1</td>
            <td>パラメータ</td><td>70</td><td>28</td><td></td><td></td><td></td><td></td>
            <td>コスト</td><td>20</td><td>6</td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
          </tr>
          <tr>
            <td>輝け！</td><td>1</td>
            <td>効果</td><td>70</td><td>全力になった時、このスキルカードのパラメータ値増加+3</td><td></td><td></td><td></td><td></td>
            <td>効果</td><td>40</td><td>レッスン中1回の制限解除</td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
          </tr>
        </tbody>
      </table>
    `

    expect(extractWikiCustomizationSpecs(html)).toMatchObject([
      {
        maxSelections: 3,
        name: '勢い任せ',
        slots: [
          {
            label: 'バフ',
            slotKey: 'A',
            tiers: [
              { label: '好調状態の場合、集中5', tierKey: '1' },
              { label: '好調状態の場合、集中6', tierKey: '2' },
              { label: '好調状態の場合、集中8', tierKey: '3' },
            ],
          },
          {
            label: 'パラメータ',
            slotKey: 'B',
            tiers: [{ label: 'パラメータ上昇回数+1', tierKey: '1' }],
          },
          {
            label: 'パラメータ',
            slotKey: 'C',
            tiers: [
              { label: '12', tierKey: '1' },
              { label: '15', tierKey: '2' },
              { label: '24', tierKey: '3' },
            ],
          },
        ],
      },
      {
        maxSelections: 1,
        name: 'シュプレヒコール',
        slots: [
          {
            label: 'コスト',
            slotKey: 'A',
            tiers: [{ label: '集中消費1', tierKey: '1' }],
          },
          {
            label: '効果',
            slotKey: 'B',
            tiers: [{ label: '手札をすべてレッスン中強化', tierKey: '1' }],
          },
        ],
      },
      {
        maxSelections: 1,
        name: '心・技・体',
        slots: [
          {
            label: 'パラメータ',
            slotKey: 'A',
            tiers: [{ label: '28', tierKey: '1' }],
          },
          {
            label: 'コスト',
            slotKey: 'B',
            tiers: [{ label: '6', tierKey: '1' }],
          },
        ],
      },
      {
        maxSelections: 1,
        name: '輝け！',
        slots: [
          {
            label: '効果',
            slotKey: 'A',
            tiers: [{ label: '全力になった時、このスキルカードのパラメータ値増加+3', tierKey: '1' }],
          },
          {
            label: '効果',
            slotKey: 'B',
            tiers: [{ label: 'レッスン中1回の制限解除', tierKey: '1' }],
          },
        ],
      },
    ])
  })

  it('extracts customization slots from the Seesaa skill list layout and skips 対象外 cards', () => {
    const html = `
      <table class="edit">
        <tbody>
          <tr>
            <th>カード<br />(Wiki用ID)</th>
            <th colspan="8">性能</th>
            <th>編集</th>
          </tr>
          <tr>
            <th rowspan="11">気合十分！<br />(com_F_R_M_0001)</th>
            <th>レア</th><td>R</td><th>タイプ</th><td colspan="3">メンタル</td><th>カスタム上限</th><td>3</td><td>編集</td>
          </tr>
          <tr><th>+</th><th>消費</th><th colspan="4">効果</th><th colspan="2">備考</th><th>編集</th></tr>
          <tr><td>無印</td><td>0</td><td colspan="4">元気+2<br />消費体力減少2ターン</td><td colspan="2">PLv16で解放</td><td>編集</td></tr>
          <tr><td>+</td><td>0</td><td colspan="4">元気+2<br />消費体力減少3ターン</td><td>編集</td></tr>
          <tr><td>++</td><td>0</td><td colspan="4">元気+4<br />消費体力減少3ターン</td><td>編集</td></tr>
          <tr><td>+++</td><td>0</td><td colspan="4">元気+6<br />消費体力減少3ターン</td><td>編集</td></tr>
          <tr><th rowspan="5">カ<br />ス<br />タ<br />ム</th><th>種類</th><th colspan="2">元気+</th><th colspan="2">消費体力減少+</th><th colspan="2">開始時手札に入る</th><th>編集</th></tr>
          <tr><th>段階</th><th>消費P</th><th>効果</th><th>消費P</th><th>効果</th><th>消費P</th><th>効果</th><th>編集</th></tr>
          <tr><th>1段階</th><td>40</td><td>元気+6</td><td>40</td><td>消費体力減少4ターン</td><td>70</td><td>レッスン開始時手札に入る</td><td>編集</td></tr>
          <tr><th>2段階</th><td>40</td><td>元気+10</td><td>40</td><td>消費体力減少5ターン</td><td>--</td><td>--</td><td>編集</td></tr>
          <tr><th>3段階</th><td>70</td><td>元気+19</td><td>70</td><td>消費体力減少7ターン</td><td>--</td><td>--</td><td>編集</td></tr>
          <tr><th colspan="9"></th><th>編集</th></tr>
          <tr>
            <th rowspan="9">一心不乱<br />(com_A_SSR_M_0002)</th>
            <th>レア</th><td>SSR</td><th>タイプ</th><td colspan="3">メンタル</td><th>カスタム上限</th><td>1</td><td>編集</td>
          </tr>
          <tr><th>+</th><th>消費</th><th colspan="4">効果</th><th colspan="2">備考</th><th>編集</th></tr>
          <tr><td>無印</td><td>-3</td><td colspan="4">強気の場合、使用可<br />温存に変更<br />強気効果のスキルカードのパラメータ値増加+37・コスト値増加+7</td><td colspan="2">PLv38で解放</td><td>編集</td></tr>
          <tr><td>+</td><td>-3</td><td colspan="4">強気の場合、使用可<br />温存に変更<br />強気効果のスキルカードのパラメータ値増加+45・コスト値増加+7</td><td>編集</td></tr>
          <tr><td>++</td><td>-3</td><td colspan="4">強気の場合、使用可<br />温存に変更<br />強気効果のスキルカードのパラメータ値増加+48・コスト値増加+7</td><td>編集</td></tr>
          <tr><td>+++</td><td>-3</td><td colspan="4">強気の場合、使用可<br />温存に変更<br />強気効果のスキルカードのパラメータ値増加+52・コスト値増加+7</td><td>編集</td></tr>
          <tr><th rowspan="3">カ<br />ス<br />タ<br />ム</th><th>種類</th><th colspan="2">温存+</th><th colspan="2">元気追加</th><th colspan="2">--</th><th>編集</th></tr>
          <tr><th>段階</th><th>消費P</th><th>効果</th><th>消費P</th><th>効果</th><th>消費P</th><th>効果</th><th>編集</th></tr>
          <tr><th>1段階</th><td>70</td><td>温存2段階目に変更</td><td>70</td><td>元気+9</td><td>--</td><td>--</td><td>編集</td></tr>
          <tr><th colspan="9"></th><th>編集</th></tr>
          <tr>
            <th rowspan="6">希望が届くまで<br />(Temari_SSR_0006)</th>
            <th>レア</th><td>SSR</td><th>タイプ</th><td colspan="3">メンタル</td><th>カスタム上限</th><td>対象外</td><td>編集</td>
          </tr>
          <tr><th>+</th><th>消費</th><th colspan="4">効果</th><th colspan="2">備考</th><th>編集</th></tr>
          <tr><td>無印</td><td>体力消費8</td><td colspan="4">以降、スキルカードが除外に移動した時、好調2ターン</td><td colspan="2">固有</td><td>編集</td></tr>
        </tbody>
      </table>
    `

    expect(extractSeesaaCustomizationSpecs(html)).toMatchObject([
      {
        maxSelections: 3,
        name: '気合十分！',
        slots: [
          {
            label: '元気',
            slotKey: 'A',
            tiers: [
              { label: '元気+6', tierKey: '1' },
              { label: '元気+10', tierKey: '2' },
              { label: '元気+19', tierKey: '3' },
            ],
          },
          {
            label: '消費体力減少',
            slotKey: 'B',
            tiers: [
              { label: '消費体力減少4ターン', tierKey: '1' },
              { label: '消費体力減少5ターン', tierKey: '2' },
              { label: '消費体力減少7ターン', tierKey: '3' },
            ],
          },
          {
            label: '開始時手札',
            slotKey: 'C',
            tiers: [{ label: 'レッスン開始時手札に入る', tierKey: '1' }],
          },
        ],
      },
      {
        maxSelections: 1,
        name: '一心不乱',
        slots: [
          {
            label: '温存',
            slotKey: 'A',
            tiers: [{ label: '温存2段階目に変更', tierKey: '1' }],
          },
          {
            label: '元気',
            slotKey: 'B',
            tiers: [{ label: '元気+9', tierKey: '1' }],
          },
        ],
      },
    ])
  })

  it('extracts card rarities from the Seesaa skill list layout', () => {
    const html = `
      <table class="edit">
        <tbody>
          <tr>
            <th rowspan="6">スターライト<br />(com_A_R_A_0002)</th>
            <th>レア</th><td>R</td><th>タイプ</th><td colspan="3">アクティブ</td><th>カスタム上限</th><td>3</td><td>編集</td>
          </tr>
          <tr><th>+</th><th>消費</th><th colspan="4">効果</th><th colspan="2">備考</th><th>編集</th></tr>
          <tr><td>無印</td><td>-6</td><td colspan="4">強気に変更<br />パラメータ+9</td><td colspan="2"></td><td>編集</td></tr>
          <tr><th colspan="9"></th><th>編集</th></tr>
          <tr>
            <th rowspan="6">一歩<br />(com_A_R_A_0017)</th>
            <th>レア</th><td>R</td><th>タイプ</th><td colspan="3">アクティブ</td><th>カスタム上限</th><td>1</td><td>編集</td>
          </tr>
          <tr><th>+</th><th>消費</th><th colspan="4">効果</th><th colspan="2">備考</th><th>編集</th></tr>
        </tbody>
      </table>
    `

    expect(extractSeesaaCardRarities(html)).toEqual([
      { name: 'スターライト', rarity: 'R' },
      { name: '一歩', rarity: 'R' },
    ])
  })
})
