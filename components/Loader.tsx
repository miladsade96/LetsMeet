import Image from "next/image";

export default function Loader() {
  return (
    <div className="flex-center w-full h-screen">
      <Image
        src="/icons/loading-circle.svg"
        alt="Loading"
        width={50}
        height={50}
      />
    </div>
  );
}
