import React, { useState, useEffect } from 'react';
import { createDeck } from './deck'; // deck.js에서 함수 가져오기
import { database } from './firebase'; // Firebase 설정 가져오기
import { ref, set, onValue } from 'firebase/database';

function App() {
  const [deck, setDeck] = useState(createDeck()); // 초기 덱 생성 및 상태 저장
  const [tableCards, setTableCards] = useState([]);
  const [player1Hand, setPlayer1Hand] = useState([]); // player1의 패 상태 저장
  const [player2Hand, setPlayer2Hand] = useState([]); // player2의 패 상태 저장
  const [turn, setTurn] = useState('player1');
  const [button, setButton] = useState('player1'); // 현재 버튼 플레이어 (초기값은 player1)
  const [player1Bet, setPlayer1Bet] = useState(1); // 스몰 블라인드
  const [player2Bet, setPlayer2Bet] = useState(2); // 빅 블라인드
  const [player1Chips, setPlayer1Chips] = useState(10000 - 1); // 스몰 블라인드 반영
  const [player2Chips, setPlayer2Chips] = useState(10000 - 2); // 빅 블라인드 반영
  const [player1InputBet, setPlayer1InputBet] = useState(player1Bet); // 플레이어 1의 입력값 상태
  const [player2InputBet, setPlayer2InputBet] = useState(player2Bet); // 플레이어 2의 입력값 상태





  function dealStartingHands() {
    const player1Hand = deck.splice(0, 2);
    const player2Hand = deck.splice(0, 2);
  
    // 초기 블라인드 설정에 따른 베팅 및 칩 감소
    const initialPlayer1Bet = button === 'player1' ? 1 : 2;
    const initialPlayer2Bet = button === 'player1' ? 2 : 1;
  
    set(ref(database, 'pokerGame/players/player1'), {
      hand: player1Hand,
      chips: 10000 - initialPlayer1Bet,
      bet: initialPlayer1Bet,
    });
    set(ref(database, 'pokerGame/players/player2'), {
      hand: player2Hand,
      chips: 10000 - initialPlayer2Bet,
      bet: initialPlayer2Bet,
    });
  
    setPlayer1Hand(player1Hand);
    setPlayer2Hand(player2Hand);
    setPlayer1Chips(10000 - initialPlayer1Bet);
    setPlayer2Chips(10000 - initialPlayer2Bet);
    setPlayer1Bet(initialPlayer1Bet);
    setPlayer2Bet(initialPlayer2Bet);
    setDeck([...deck]);
  }





  // 문양을 기호로 변환하는 함수
  function suitSymbol(suit) {
    switch (suit) {
      case 'Hearts':
        return '♥️';
      case 'Diamonds':
        return '♦️';
      case 'Clubs':
        return '♣️';
      case 'Spades':
        return '♠️';
      default:
        return suit;
    }
  }





  // 카드를 기호와 숫자로 변환하여 렌더링하는 함수
  function renderCard(card) {
    return `${card.rank} ${suitSymbol(card.suit)}`;
  }





  function placeBet(player, amount) {
    if (player === 'player1' && amount >= player1Bet && player1Chips >= amount) {
      set(ref(database, 'pokerGame/players/player1/bet'), amount);
      set(ref(database, 'pokerGame/players/player1/chips'), player1Chips - (amount - player1Bet));
      setPlayer1Bet(amount);
      setPlayer1Chips(player1Chips - (amount - player1Bet));
      // 턴을 player2로 변경
      set(ref(database, 'pokerGame/turn'), 'player2');
    } else if (player === 'player2' && amount >= player2Bet && player2Chips >= amount) {
      set(ref(database, 'pokerGame/players/player2/bet'), amount);
      set(ref(database, 'pokerGame/players/player2/chips'), player2Chips - (amount - player2Bet));
      setPlayer2Bet(amount);
      setPlayer2Chips(player2Chips - (amount - player2Bet));
      // 턴을 player1로 변경
      set(ref(database, 'pokerGame/turn'), 'player1');
    }
  }
  
  
  



  // Firebase에서 턴 값 실시간으로 가져오기
  useEffect(() => {
    // 서버에서 button 상태를 가져와 클라이언트와 동기화
    const buttonRef = ref(database, 'pokerGame/button');
    onValue(buttonRef, (snapshot) => {
      if (snapshot.exists()) {
        const serverButton = snapshot.val();
        if (serverButton !== button) {
          setButton(serverButton);
        }
      }
    });
  
    // 서버에서 turn 상태를 가져와 클라이언트와 동기화 됨
    const turnRef = ref(database, 'pokerGame/turn');
    onValue(turnRef, (snapshot) => {
      if (snapshot.exists()) {
        const serverTurn = snapshot.val();
        if (serverTurn !== turn) {
          setTurn(serverTurn);
        }
      }
    });
  }, [button, turn]);
  
  





  // Flop 공개 함수
  function revealFlop() {
    const flopCards = deck.splice(0, 3); // 덱에서 카드 3장 추출
    setTableCards(flopCards);
    set(ref(database, 'pokerGame/tableCards'), flopCards);
    setDeck([...deck]); // 남은 덱 상태 업데이트
  }


  


  // Turn 공개 함수
  function revealTurn() {
    const turnCard = deck.splice(0, 1); // 덱에서 카드 1장 추출
    const updatedTableCards = [...tableCards, ...turnCard];
    setTableCards(updatedTableCards);
    set(ref(database, 'pokerGame/tableCards'), updatedTableCards);
    setDeck([...deck]); // 남은 덱 상태 업데이트
  }





  // River 공개 함수
  function revealRiver() {
    const riverCard = deck.splice(0, 1); // 덱에서 카드 1장 추출
    const updatedTableCards = [...tableCards, ...riverCard];
    setTableCards(updatedTableCards);
    set(ref(database, 'pokerGame/tableCards'), updatedTableCards);
    setDeck([...deck]); // 남은 덱 상태 업데이트
  }





  function switchButton() {
    const newButton = button === 'player1' ? 'player2' : 'player1';
    setButton(newButton);
  
    // 새로운 버튼에 따라 블라인드 베팅 초기화
    if (newButton === 'player1') {
      setPlayer1Bet(1);
      setPlayer2Bet(2);
      setPlayer1Chips((prevChips) => prevChips - 1);
      setPlayer2Chips((prevChips) => prevChips - 2);
    } else {
      setPlayer1Bet(2);
      setPlayer2Bet(1);
      setPlayer1Chips((prevChips) => prevChips - 2);
      setPlayer2Chips((prevChips) => prevChips - 1);
    }
  
    // Firebase에 새로운 블라인드 값과 버튼 저장
    set(ref(database, 'pokerGame/players/player1/bet'), newButton === 'player1' ? 1 : 2);
    set(ref(database, 'pokerGame/players/player2/bet'), newButton === 'player1' ? 2 : 1);
    set(ref(database, 'pokerGame/players/player1/chips'), button === 'player1' ? player1Chips - 1 : player1Chips - 2);
    set(ref(database, 'pokerGame/players/player2/chips'), button === 'player1' ? player2Chips - 2 : player2Chips - 1);
    set(ref(database, 'pokerGame/button'), newButton);
  }





  function resetGame() {
    const initialChips = 10000;
  
    // 버튼 위치를 랜덤으로 설정 (player1 또는 player2 중 하나)
    const randomButton = Math.random() < 0.5 ? 'player1' : 'player2';
    setButton(randomButton);
  
    // 버튼 위치에 따라 스몰 블라인드와 빅 블라인드를 설정
    const initialPlayer1Bet = randomButton === 'player1' ? 1 : 2;
    const initialPlayer2Bet = randomButton === 'player1' ? 2 : 1;
  
    // Firebase에 저장된 플레이어 1 데이터 초기화
    set(ref(database, 'pokerGame/players/player1'), {
      hand: [],
      chips: initialChips - initialPlayer1Bet,
      bet: initialPlayer1Bet,
    });
  
    // Firebase에 저장된 플레이어 2 데이터 초기화
    set(ref(database, 'pokerGame/players/player2'), {
      hand: [],
      chips: initialChips - initialPlayer2Bet,
      bet: initialPlayer2Bet,
    });
  
    // 테이블 카드 초기화
    set(ref(database, 'pokerGame/tableCards'), []);
  
    // 턴 초기화: 버튼 위치에 있는 플레이어에게 턴 부여 (스몰 블라인드가 먼저 행동)
    const initialTurn = randomButton;
    set(ref(database, 'pokerGame/turn'), initialTurn);
  
    // 버튼 위치를 Firebase에 저장
    set(ref(database, 'pokerGame/button'), randomButton);
  
    // 로컬 상태도 초기화
    setPlayer1InputBet(initialPlayer1Bet);
    setPlayer2InputBet(initialPlayer2Bet);
    setPlayer1Bet(initialPlayer1Bet);
    setPlayer2Bet(initialPlayer2Bet);
    setPlayer1Hand([]);
    setPlayer2Hand([]);
    setTableCards([]);
    setTurn(initialTurn);
  
    // 덱을 다시 섞어 초기화
    const newDeck = createDeck();
    setDeck(newDeck);
  }
  
  
  
  

  return (
    <div className="App">
      <h1>1대1 포커 게임</h1><br />
      <h2>버튼 포지션: {button === 'player1' ? '플레이어 1' : '플레이어 2'}</h2>
      <button onClick={dealStartingHands}>시작 패 나누기</button>
      <button onClick={revealFlop}>Flop 공개</button>
      <button onClick={revealTurn}>Turn 공개</button>
      <button onClick={revealRiver}>River 공개</button>
  
      <h2>" 플레이어 1 "</h2>
      <h2>칩 : {player1Chips}</h2>
      <input
      type="number"
      placeholder="Player 1 Bet"
      min={player1Bet} // 최소 베팅 금액 설정
      value={player1InputBet} // 상태와 인풋 필드를 연결
      onChange={(e) => setPlayer1InputBet(Number(e.target.value))}
      />
      <button 
      onClick={() => placeBet('player1', player1InputBet)} 
      disabled={turn !== 'player1' || player1InputBet < player1Bet} // 현재 베팅보다 작은 값은 불가
        >
        Player 1 Bet
      </button>
      
      <h2>핸드</h2>
      {/* 기호와 숫자로 표현된 플레이어 1의 핸드 */}
      <p>{player1Hand.map(renderCard).join(' / ')}</p>
      <h2>베팅 금액 : {player1Bet}</h2>

      <h2>" 플레이어 2 "</h2>
      <h2>칩 : {player2Chips}</h2>
      <input
      type="number"
      placeholder="Player 2 Bet"
      min={player2Bet} // 최소 베팅 금액 설정
      value={player2InputBet} // 상태와 인풋 필드를 연결
      onChange={(e) => setPlayer2InputBet(Number(e.target.value))}
      />
      <button 
        onClick={() => placeBet('player2', player2InputBet)} 
        disabled={turn !== 'player2' || player2InputBet < player2Bet} // 현재 베팅보다 작은 값은 불가
      >
        Player 2 Bet
      </button>
      
      <h2>핸드</h2>
      {/* 기호와 숫자로 표현된 플레이어 2의 핸드 */}
      <p>{player2Hand.map(renderCard).join(' / ')}</p>
      <h2>베팅 금액 : {player2Bet}</h2>
  
      <h2>" 테이블 카드 "</h2>
      {/* 기호와 숫자로 표현된 테이블 카드 */}
      <p>{tableCards.map(renderCard).join(' / ')}</p>

      <button onClick={resetGame}>게임 리셋</button>
    </div>
  );
}

export default App;
