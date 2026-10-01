import { Link } from "react-router";
import LanguageFlag from "./LanguageFlag";

const FriendCard = ({ friend, online = false, actions }) => {
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`avatar ${online ? "online" : "offline"}`}>
            <div className="size-12 rounded-full">
              <img src={friend.profilePic} alt="" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>
            <p className={`text-xs ${online ? "text-success" : "opacity-60"}`}>
              {online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            <LanguageFlag language={friend.nativeLanguage} />
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            <LanguageFlag language={friend.learningLanguage} />
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <div className="flex gap-2">
          <Link to={`/chat/${friend._id}`} className="btn btn-outline flex-1">
            Message
          </Link>
          {actions}
        </div>
      </div>
    </div>
  );
};
export default FriendCard;
