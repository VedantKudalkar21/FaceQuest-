
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
} from "@react-three/drei";

function Eye({ position }) {
  return (
    <group position={position}>
      <mesh scale={[1, 1.18, 0.42]}>
        <sphereGeometry args={[0.105, 32, 32]} />
        <meshStandardMaterial color="#FFFDF8" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.037]} scale={[1, 1.05, 0.55]}>
        <sphereGeometry args={[0.066, 32, 32]} />
        <meshStandardMaterial color="#4A281B" roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.069]}>
        <sphereGeometry args={[0.035, 24, 24]} />
        <meshStandardMaterial color="#17131A" roughness={0.18} />
      </mesh>
      <mesh position={[-0.023, 0.028, 0.09]}>
        <sphereGeometry args={[0.017, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

function HairLock({ position, scale, rotation = [0, 0, 0], color }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow>
      <sphereGeometry args={[1, 24, 20]} />
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  );
}

function AvatarModel({ appearance }) {
  const root = useRef();

  useFrame((state, delta) => {
    if (root.current) {
      root.current.rotation.y += delta * 0.12;
    }
  });

  
    const skin = appearance?.skinColor || "#C98F69";
    const hair = appearance?.hairColor || "#30251F";
    const outfit = appearance?.outfitColor || "#7657F6";

    const hairstyle = appearance?.hairstyle || "swept";
    const faceShape = appearance?.faceShape || "oval";
    const accessories = appearance?.accessories || "none";

    const faceScales = {
    oval: [0.345, 0.435, 0.315],
    round: [0.365, 0.39, 0.325],
    square: [0.36, 0.42, 0.32],
    };

    const selectedFaceScale = faceScales[faceShape] || faceScales.oval;

  const dark = "#201D2A";
  const pants = "#292632";
  const shoe = "#F7F5FA";

  return (
    <group ref={root} position={[0, -1.25, 0]}>
      {/* Sneakers */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.22, 0.1, 0.07]}>
          <mesh castShadow position={[0, 0.06, 0.02]}>
            <boxGeometry args={[0.34, 0.18, 0.49]} />
            <meshStandardMaterial color={shoe} roughness={0.42} />
          </mesh>
          <mesh position={[0, -0.025, 0.02]}>
            <boxGeometry args={[0.35, 0.045, 0.5]} />
            <meshStandardMaterial color="#D8D5E2" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.145, 0.02]}>
            <boxGeometry args={[0.2, 0.025, 0.24]} />
            <meshStandardMaterial color="#DAD6E5" />
          </mesh>
        </group>
      ))}

      {/* Jogger legs */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.21, 0.55, 0]}>
          <mesh castShadow position={[0, 0.31, 0]}>
            <capsuleGeometry args={[0.145, 0.48, 8, 16]} />
            <meshStandardMaterial color={pants} roughness={0.92} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.13, 0.14, 0.12, 20]} />
            <meshStandardMaterial color={dark} roughness={0.95} />
          </mesh>
          <mesh position={[side * 0.025, 0.43, 0.133]}>
            <boxGeometry args={[0.19, 0.2, 0.035]} />
            <meshStandardMaterial color="#383441" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Hoodie body */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.55, 8, 24]} />
        <meshStandardMaterial color={outfit} roughness={0.86} />
      </mesh>

      {/* Dark hoodie front */}
      <mesh position={[0, 1.3, 0.296]} castShadow>
        <capsuleGeometry args={[0.255, 0.45, 8, 20]} />
        <meshStandardMaterial color={dark} roughness={0.95} />
      </mesh>

      {/* Hoodie pocket */}
      <mesh position={[0, 1.03, 0.34]}>
        <boxGeometry args={[0.36, 0.13, 0.035]} />
        <meshStandardMaterial color="#35313F" roughness={0.9} />
      </mesh>

      {/* Sleeves */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 0.42, 1.26, 0]}
          rotation={[0, 0, side * -0.2]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.135, 0.49, 8, 18]} />
            <meshStandardMaterial color={outfit} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.105, 0.11, 0.12, 20]} />
            <meshStandardMaterial color={dark} roughness={0.95} />
          </mesh>
          <mesh position={[0, -0.38, 0.015]}>
            <sphereGeometry args={[0.105, 20, 20]} />
            <meshStandardMaterial color={skin} roughness={0.68} />
          </mesh>
        </group>
      ))}

      {/* Neck */}
      <mesh position={[0, 1.77, 0]}>
        <cylinderGeometry args={[0.105, 0.13, 0.22, 24]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>

      {/* Hood behind head */}
      <mesh position={[0, 1.88, -0.1]} castShadow>
        <sphereGeometry args={[0.36, 28, 24]} />
        <meshStandardMaterial color={dark} roughness={0.95} />
      </mesh>

      {/* Ears */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.355, 2.13, 0]}>
          <mesh scale={[0.53, 0.75, 0.36]}>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshStandardMaterial color={skin} roughness={0.72} />
          </mesh>
          <mesh position={[0, 0, 0.035]} scale={[0.3, 0.48, 0.2]}>
            <sphereGeometry args={[0.12, 20, 20]} />
            <meshStandardMaterial color="#B97562" roughness={0.8} />
          </mesh>
        </group>
      ))}


        {/* Customizable face shape */}
        <mesh
        position={[0, 2.15, 0]}
        scale={selectedFaceScale}
        castShadow
        >
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color={skin} roughness={0.62} />
        </mesh>

        
        {/* Hairstyle base */}
            <HairLock
            position={[0, 2.43, -0.035]}
            scale={
                hairstyle === "undercut"
                ? [0.34, 0.19, 0.29]
                : [0.355, 0.23, 0.31]
            }
            color={hair}
            />

        {/* Swept hairstyle */}
        {hairstyle === "swept" && (
        <>
            <HairLock
            position={[-0.17, 2.57, 0.025]}
            scale={[0.24, 0.12, 0.2]}
            rotation={[0, 0, 0.38]}
            color={hair}
            />
            <HairLock
            position={[0.02, 2.61, 0.02]}
            scale={[0.25, 0.13, 0.19]}
            rotation={[0, 0, -0.15]}
            color={hair}
            />
            <HairLock
            position={[0.19, 2.55, 0.015]}
            scale={[0.2, 0.12, 0.2]}
            rotation={[0, 0, -0.5]}
            color={hair}
            />
        </>
        )}

        {/* Curly hairstyle */}
        {hairstyle === "curly" &&
        Array.from({ length: 9 }, (_, i) => {
            const angle = (i / 9) * Math.PI * 2;
            return (
            <HairLock
                key={i}
                position={[
                Math.cos(angle) * 0.23,
                2.49 + (i % 3) * 0.055,
                Math.sin(angle) * 0.18 + 0.015,
                ]}
                scale={[0.12, 0.115, 0.12]}
                color={hair}
            />
            );
        })}

        {/* Spiky hairstyle */}
        {hairstyle === "spiky" &&
        Array.from({ length: 7 }, (_, i) => (
            <mesh
            key={i}
            position={[(i - 3) * 0.085, 2.61 + (i % 2) * 0.035, 0]}
            rotation={[0, 0, (i - 3) * -0.12]}
            castShadow
            >
            <coneGeometry args={[0.09, 0.24, 8]} />
            <meshStandardMaterial color={hair} roughness={0.72} />
            </mesh>
        ))}

        {/* Undercut hairstyle */}
        {hairstyle === "undercut" && (
         <>
            <HairLock
            position={[-0.15, 2.57, 0.02]}
            scale={[0.22, 0.12, 0.2]}
            rotation={[0, 0, 0.25]}
            color={hair}
            />
            <HairLock
            position={[0.04, 2.59, 0.02]}
            scale={[0.23, 0.12, 0.2]}
            rotation={[0, 0, -0.15]}
            color={hair}
            />
         </>
        )}

      {/* Layered swept hair */}
      
        <HairLock
        position={[0, 2.43, -0.035]}
        scale={
            hairstyle === "undercut"
            ? [0.34, 0.19, 0.29]
            : [0.355, 0.23, 0.31]
        }
        color={hair}
        />

        {/* Swept hairstyle */}
        {hairstyle === "swept" && (
          <>
            <HairLock
            position={[-0.17, 2.57, 0.025]}
            scale={[0.24, 0.12, 0.2]}
            rotation={[0, 0, 0.38]}
            color={hair}
            />
            <HairLock
            position={[0.02, 2.61, 0.02]}
            scale={[0.25, 0.13, 0.19]}
            rotation={[0, 0, -0.15]}
            color={hair}
            />
            <HairLock
            position={[0.19, 2.55, 0.015]}
            scale={[0.2, 0.12, 0.2]}
            rotation={[0, 0, -0.5]}
            color={hair}
            />
         </>
        )}

        {/* Curly hairstyle */}
        {hairstyle === "curly" &&
        Array.from({ length: 9 }, (_, i) => {
            const angle = (i / 9) * Math.PI * 2;
            return (
            <HairLock
                key={i}
                position={[
                Math.cos(angle) * 0.23,
                2.49 + (i % 3) * 0.055,
                Math.sin(angle) * 0.18 + 0.015,
                ]}
                scale={[0.12, 0.115, 0.12]}
                color={hair}
            />
            );
        })}

        {/* Spiky hairstyle */}
        {hairstyle === "spiky" &&
        Array.from({ length: 7 }, (_, i) => (
            <mesh
            key={i}
            position={[(i - 3) * 0.085, 2.61 + (i % 2) * 0.035, 0]}
            rotation={[0, 0, (i - 3) * -0.12]}
            castShadow
            >
            <coneGeometry args={[0.09, 0.24, 8]} />
            <meshStandardMaterial color={hair} roughness={0.72} />
            </mesh>
        ))}

        {/* Undercut hairstyle */}
        {hairstyle === "undercut" && (
        <>
            <HairLock
            position={[-0.15, 2.57, 0.02]}
            scale={[0.22, 0.12, 0.2]}
            rotation={[0, 0, 0.25]}
            color={hair}
            />
            <HairLock
            position={[0.04, 2.59, 0.02]}
            scale={[0.23, 0.12, 0.2]}
            rotation={[0, 0, -0.15]}
            color={hair}
            />
        </>
        )}

      {/* Brows */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.135, 2.255, 0.28]}
          rotation={[0, 0, side * -0.12]}
          scale={[1, 1, 0.35]}
        >
          <capsuleGeometry args={[0.035, 0.105, 6, 12]} />
          <meshStandardMaterial color={hair} roughness={0.75} />
        </mesh>
      ))}

      {/* Expressive eyes */}
      <Eye position={[-0.135, 2.15, 0.29]} />
      <Eye position={[0.135, 2.15, 0.29]} />

      {/* Nose */}
      <mesh position={[0, 2.055, 0.323]} scale={[0.75, 0.7, 0.65]}>
        <sphereGeometry args={[0.047, 24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* Smile */}
      <mesh position={[0, 1.97, 0.291]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.067, 0.009, 10, 32, Math.PI]} />
        <meshStandardMaterial color="#7C3D43" roughness={0.65} />
      </mesh>

      
        {/* Optional glasses */}
        {accessories === "glasses" && (
            <group position={[0, 2.15, 0.355]}>
                {[-1, 1].map((side) => (
                <mesh
                    key={side}
                    position={[side * 0.135, 0, 0]}
                >
                    <torusGeometry args={[0.087, 0.012, 10, 32]} />
                    <meshStandardMaterial
                    color="#292334"
                    metalness={0.55}
                    roughness={0.3}
                    />
                </mesh>
                ))}

                <mesh position={[0, 0.01, 0]}>
                <boxGeometry args={[0.09, 0.014, 0.018]} />
                <meshStandardMaterial color="#292334" metalness={0.5} />
                </mesh>
            </group>
            )}

            {/* Optional necklace */}
            {accessories === "chain" && (
            <mesh
                position={[0, 1.63, 0.19]}
                rotation={[Math.PI / 2.7, 0, 0]}
            >
                <torusGeometry args={[0.19, 0.018, 10, 40, Math.PI]} />
                <meshStandardMaterial
                color="#E4C16F"
                metalness={0.8}
                roughness={0.25}
                />
            </mesh>
        )}


      {/* Face highlights */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.21, 2.04, 0.263]}
          scale={[0.065, 0.025, 0.008]}
        >
          <sphereGeometry args={[1, 20, 16]} />
          <meshStandardMaterial
            color="#EF9C91"
            transparent
            opacity={0.34}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function AvatarScene({ appearance = {} }) {
  return (
    <div className="avatar-scene">
      <Canvas
        shadows
        camera={{ position: [0, 1.35, 5.8], fov: 34 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#EDE9FF"]} />
        <ambientLight intensity={1.65} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={2.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-3, 3, -2]}
          intensity={1.1}
          color="#C8B8FF"
        />
        <pointLight position={[0, 2, 3]} intensity={0.65} color="#FFFFFF" />

        <AvatarModel appearance={appearance} />

        <ContactShadows
          position={[0, -1.13, 0]}
          opacity={0.26}
          scale={4}
          blur={2.5}
          far={3}
        />

        <Environment preset="city" />

        <OrbitControls
          enablePan={false}
          minDistance={4.5}
          maxDistance={7}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}
