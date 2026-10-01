import { Link } from "react-router";

const NotFoundPage = () => (
  <div className="h-full min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 className="text-5xl font-bold">404</h1>
    <p className="opacity-70">This page does not exist.</p>
    <Link to="/" className="btn btn-primary">
      Back to home
    </Link>
  </div>
);

export default NotFoundPage;
