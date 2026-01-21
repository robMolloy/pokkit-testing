import { useParams } from "react-router-dom";

export default function Page() {
  const params = useParams();

  return <div>dynamic.${params.id}</div>;
}
