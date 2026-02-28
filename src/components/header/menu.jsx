import { useRef } from "react";
import "./menu.css";
import { useOutsideClick } from "../../hooks";
import inoutLogo from "../../assets/inoutLogo.svg";
import { Checkbox } from "../Checkbox";
import { ProvablySettings } from "./provably-settings";
import { GameRules } from "./game-rules";

export function Menu({ openHowToPlayModal }) {
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const provablyRef = useRef(null);
  const gameRulesRef = useRef(null);

  const handleOpenProvably = () => {
    if (provablyRef.current) {
      dropdownRef.current.close();
      provablyRef.current.showModal();
    }
  };

  const handleOpenGameRules = () => {
    if (gameRulesRef.current) {
      dropdownRef.current.close();
      gameRulesRef.current.showModal();
    }
  };

  const handleClick = () => {
    if (dropdownRef.current) {
      if (dropdownRef.current.open) {
        dropdownRef.current.close();
      } else {
        dropdownRef.current.show();
      }
    }
  };

  const handleClose = () => {
    if (dropdownRef.current.open) {
      dropdownRef.current.close();
    }
  };

  const handleOpenHowToPlay = () => {
    handleClose();
    if (typeof openHowToPlayModal === "function") {
      openHowToPlayModal();
    }
  };

  useOutsideClick(dropdownRef, handleClose, menuRef);

  return (
    <div className="menu-button" onClick={handleClick} ref={menuRef}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="2"
          y1="4.5"
          x2="16"
          y2="4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="2"
          y1="9"
          x2="16"
          y2="9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="2"
          y1="13.5"
          x2="16"
          y2="13.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <Dropdown
        ref={dropdownRef}
        openHowToPlayModal={handleOpenHowToPlay}
        openProvably={handleOpenProvably}
        openGameRules={handleOpenGameRules}
      />
      <ProvablySettings ref={provablyRef} />
      <GameRules ref={gameRulesRef} />
    </div>
  );
}

function Dropdown({ ref, openHowToPlayModal, openProvably, openGameRules }) {
  return (
    <dialog
      className="MenuContainer"
      ref={ref}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="MenuHeader">
        <div className="MenuHeaderUserAvatar">
          <img
            src="data:image/png;base64,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"
            alt="avatar"
          />
        </div>
        <div className="MenuHeaderUserName">Purple Visiting Koi</div>
        <div data-testid="menu-avatar-modal" className="MenuHeaderUserBtn">
          Change avatar
        </div>
      </div>
      <div className="MenuContent">
        <div className="MenuItemWithToggle">
          <div className="MenuItem">
            <span className="IconWrapper">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="iconDiver"
              >
                <path
                  d="M10.6663 5.66651C11.555 6.85185 11.555 9.14785 10.6663 10.3332M12.6663 3.33318C15.325 5.87185 15.341 10.1445 12.6663 12.6665M1.33301 9.97251V6.02651C1.33301 5.64385 1.63167 5.33318 1.99967 5.33318H4.39034C4.47856 5.33287 4.56581 5.31469 4.64681 5.27974C4.72782 5.2448 4.80091 5.19381 4.86167 5.12985L6.86167 2.87118C7.28167 2.43385 7.99967 2.74385 7.99967 3.36185V12.6378C7.99967 13.2605 7.27301 13.5678 6.85567 13.1218L4.86234 10.8758C4.8014 10.8101 4.72757 10.7575 4.64545 10.7215C4.56333 10.6855 4.47468 10.6668 4.38501 10.6665H1.99967C1.63167 10.6665 1.33301 10.3558 1.33301 9.97251Z"
                  stroke="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </span>
            <span>Sound</span>
          </div>
          <Checkbox />
        </div>
        <div className="MenuItemWithToggle">
          <div className="MenuItem">
            <span className="IconWrapper">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="iconDiver"
              >
                <path
                  d="M5.33301 11.9999V3.81054C5.33297 3.49201 5.44696 3.18399 5.65436 2.94223C5.86176 2.70048 6.14885 2.54095 6.46367 2.49254L12.4637 1.5692C12.6537 1.53998 12.8478 1.5522 13.0326 1.60501C13.2175 1.65782 13.3887 1.74998 13.5346 1.87517C13.6805 2.00036 13.7976 2.15562 13.8779 2.3303C13.9581 2.50498 13.9997 2.69496 13.9997 2.8872V10.6665"
                  stroke="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path d="M5.33301 5.99984L13.9997 4.6665" stroke="white"></path>
                <path
                  d="M5.33301 11.9997C5.33301 12.5301 5.12229 13.0388 4.74722 13.4139C4.37215 13.789 3.86344 13.9997 3.33301 13.9997C2.80257 13.9997 2.29387 13.789 1.91879 13.4139C1.54372 13.0388 1.33301 12.5301 1.33301 11.9997C1.33301 10.895 2.22834 10.6663 3.33301 10.6663C4.43767 10.6663 5.33301 10.895 5.33301 11.9997ZM13.9997 10.6663C13.9997 11.1968 13.789 11.7055 13.4139 12.0806C13.0388 12.4556 12.5301 12.6663 11.9997 12.6663C11.4692 12.6663 10.9605 12.4556 10.5855 12.0806C10.2104 11.7055 9.99967 11.1968 9.99967 10.6663C9.99967 9.56167 10.895 9.33301 11.9997 9.33301C13.1043 9.33301 13.9997 9.56167 13.9997 10.6663Z"
                  stroke="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </span>
            <span>Music</span>
          </div>
          <Checkbox />
        </div>
        <div className="MenuItemWithToggle">
          <div className="MenuItem">
            <span className="IconWrapper">
              <svg
                width="16"
                height="7"
                viewBox="0 0 16 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="spacebar"
              >
                <path
                  d="M3.21718 6.19824V1.40106C3.21718 1.24218 3.2803 1.08981 3.39264 0.977462C3.50499 0.865116 3.65736 0.802001 3.81624 0.802001H12.2031C12.362 0.802001 12.5143 0.865116 12.6267 0.977462C12.739 1.08981 12.8021 1.24218 12.8021 1.40106V6.19824M15.0361 6.19824H1.03613"
                  stroke="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </span>
            <span>«Space» to spin &amp; go</span>
          </div>
          <Checkbox />
        </div>
        <span className="MenuLine"></span>
        <div
          data-testid="menu-fair-settings"
          className="MenuItem point hover"
          onClick={openProvably}
        >
          <span className="IconWrapper">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="iconDiver pointer fillHover"
            >
              <path
                d="M7 8.295L5.705 7L5 7.705L7 9.705L11 5.705L10.295 5L7 8.295Z"
                fill="white"
              ></path>
              <path
                d="M8 15L4.912 13.3535C4.03167 12.8852 3.29549 12.1859 2.78246 11.3309C2.26944 10.4758 1.99894 9.49716 2 8.5V2C2.00027 1.73486 2.10571 1.48066 2.29319 1.29319C2.48067 1.10571 2.73487 1.00026 3 1H13C13.2651 1.00026 13.5193 1.10571 13.7068 1.29319C13.8943 1.48066 13.9997 1.73486 14 2V8.5C14.0011 9.49716 13.7306 10.4758 13.2175 11.3309C12.7045 12.1859 11.9683 12.8852 11.088 13.3535L8 15ZM3 2V8.5C2.99917 9.3159 3.22055 10.1166 3.64038 10.8162C4.06021 11.5158 4.66264 12.0879 5.383 12.471L8 13.8665L10.617 12.4715C11.3374 12.0883 11.9399 11.5162 12.3597 10.8165C12.7796 10.1168 13.0009 9.31599 13 8.5V2H3Z"
                fill="white"
              ></path>
            </svg>
          </span>
          <span>Provably fair settings</span>
        </div>
        <div
          data-testid="menu-bet-limits"
          className="MenuItem point hover"
          onClick={openGameRules}
        >
          <span className="IconWrapper">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="iconDiver"
            >
              <path
                d="M9.707 14.9998H7.5V12.7928L10.017 10.2758C10.0058 10.1842 10.0001 10.092 10 9.99977C9.99965 9.49346 10.153 8.99897 10.4399 8.58175C10.7267 8.16453 11.1335 7.84423 11.6063 7.66324C12.0792 7.48225 12.5958 7.44909 13.088 7.56817C13.5801 7.68724 14.0244 7.95293 14.3622 8.33007C14.7 8.70722 14.9154 9.17804 14.9797 9.68024C15.0441 10.1824 14.9544 10.6924 14.7227 11.1425C14.4909 11.5926 14.1279 11.9618 13.6817 12.2011C13.2355 12.4404 12.7272 12.5387 12.224 12.4828L9.707 14.9998ZM8.5 13.9998H9.293L11.896 11.3968L12.166 11.4588C12.4874 11.5352 12.825 11.5047 13.1275 11.3719C13.43 11.239 13.6809 11.0111 13.842 10.7226C14.0032 10.4342 14.0658 10.1011 14.0204 9.77381C13.9749 9.44656 13.8239 9.14307 13.5903 8.90945C13.3567 8.67583 13.0532 8.52483 12.726 8.4794C12.3987 8.43397 12.0656 8.49658 11.7771 8.65773C11.4887 8.81887 11.2607 9.06975 11.1279 9.37225C10.995 9.67475 10.9645 10.0123 11.041 10.3338L11.103 10.6038L8.5 13.2068V13.9998Z"
                fill="white"
              ></path>
              <path
                d="M12.5 10.5C12.7761 10.5 13 10.2761 13 10C13 9.72386 12.7761 9.5 12.5 9.5C12.2239 9.5 12 9.72386 12 10C12 10.2761 12.2239 10.5 12.5 10.5Z"
                fill="white"
              ></path>
              <path
                d="M4 3H10V4H4V3ZM4 5H10V6H4V5ZM4 7H7V8H4V7ZM4 12H6V13H4V12Z"
                fill="white"
              ></path>
              <path
                d="M6 15H3C2.73486 14.9997 2.48066 14.8943 2.29319 14.7068C2.10571 14.5193 2.00026 14.2651 2 14V2C2.00026 1.73486 2.10571 1.48066 2.29319 1.29319C2.48066 1.10571 2.73486 1.00026 3 1H11C11.2651 1.00026 11.5193 1.10571 11.7068 1.29319C11.8943 1.48066 11.9997 1.73486 12 2V6.5H11V2H3V14H6V15Z"
                fill="white"
              ></path>
            </svg>
          </span>
          <span>Game rules</span>
        </div>
        <div data-testid="menu-bets-history" className="MenuItem point hover">
          <span className="IconWrapper">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="iconDiver"
            >
              <path
                d="M8.37691 4.26563H7.62535C7.5566 4.26563 7.50035 4.32188 7.50035 4.39063V8.69219C7.50035 8.73281 7.5191 8.77031 7.55191 8.79375L10.1347 10.6797C10.191 10.7203 10.2691 10.7094 10.3097 10.6531L10.7566 10.0438C10.7988 9.98594 10.7863 9.90781 10.73 9.86875L8.50191 8.25781V4.39063C8.50191 4.32188 8.44566 4.26563 8.37691 4.26563ZM11.8113 5.44063L14.2613 6.03906C14.3394 6.05781 14.416 5.99844 14.416 5.91875L14.4285 3.39531C14.4285 3.29063 14.3082 3.23125 14.2269 3.29688L11.7644 5.22031C11.7458 5.23471 11.7316 5.25407 11.7235 5.27616C11.7154 5.29825 11.7137 5.32218 11.7186 5.3452C11.7235 5.36821 11.7348 5.38938 11.7512 5.40626C11.7676 5.42314 11.7884 5.43505 11.8113 5.44063ZM14.4316 10.1453L13.5457 9.84063C13.5148 9.83004 13.481 9.83196 13.4515 9.84597C13.422 9.85999 13.3991 9.88499 13.3878 9.91563C13.3582 9.99531 13.3269 10.0734 13.2941 10.1516C13.016 10.8094 12.6175 11.4016 12.1082 11.9094C11.6044 12.4147 11.0075 12.8174 10.3503 13.0953C9.66961 13.3831 8.93787 13.5309 8.19878 13.5297C7.45191 13.5297 6.72847 13.3844 6.04722 13.0953C5.3901 12.8174 4.79313 12.4147 4.28941 11.9094C3.7816 11.4016 3.38316 10.8094 3.10347 10.1516C2.81725 9.47044 2.6706 8.73882 2.67222 8C2.67222 7.25313 2.81753 6.52813 3.1066 5.84688C3.38472 5.18906 3.78316 4.59688 4.29253 4.08906C4.79625 3.58378 5.39322 3.18103 6.05035 2.90313C6.72847 2.61406 7.45347 2.46875 8.20035 2.46875C8.94722 2.46875 9.67066 2.61406 10.3519 2.90313C11.009 3.18103 11.606 3.58378 12.1097 4.08906C12.2691 4.25 12.4191 4.41719 12.5566 4.59375L13.491 3.8625C12.2613 2.29063 10.3472 1.27969 8.19722 1.28125C4.45347 1.28281 1.44722 4.32344 1.48472 8.06875C1.52222 11.7484 4.51441 14.7188 8.20035 14.7188C11.0988 14.7188 13.5675 12.8813 14.5082 10.3078C14.5316 10.2422 14.4972 10.1688 14.4316 10.1453Z"
                fill="white"
              ></path>
            </svg>
          </span>
          <span>My bet history</span>
        </div>
        <div className="MenuContent MenuHowToPlay point">
          <span className="MenuLine"></span>
          <div
            data-testid="menu-how-to-play-mobile"
            className="MenuItem"
            onClick={openHowToPlayModal}
          >
            <span className="IconWrapper">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="iconDiver"
              >
                <path
                  d="M7.96834 1.3335C4.30967 1.3335 1.33301 4.32416 1.33301 8.00016C1.33301 11.6762 4.32367 14.6668 7.99967 14.6668C11.6757 14.6668 14.6663 11.6762 14.6663 8.00016C14.6663 4.32416 11.6617 1.3335 7.96834 1.3335ZM7.99967 13.3335C5.05901 13.3335 2.66634 10.9408 2.66634 8.00016C2.66634 5.0595 5.04434 2.66683 7.96834 2.66683C10.927 2.66683 13.333 5.0595 13.333 8.00016C13.333 10.9408 10.9403 13.3335 7.99967 13.3335Z"
                  fill="white"
                ></path>
                <path
                  d="M7.33301 4.6665H8.66634V9.33317H7.33301V4.6665ZM7.33301 9.99984H8.66634V11.3332H7.33301V9.99984Z"
                  fill="white"
                ></path>
              </svg>
            </span>
            <span>How to play?</span>
          </div>
        </div>
        <span className="MenuLine"></span>
        <div className="MenuItem">
          <span className="PoweredText">Powered by</span>
          <img src={inoutLogo} alt="Inout Logo" className="LogoInout" />
        </div>
      </div>
    </dialog>
  );
}
