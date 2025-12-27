import {StyleSheet, View, Text, ScrollView, Pressable, Image as RNImage, Switch, TextInput, useWindowDimensions} from "react-native";
import Svg, { Line as SvgLine, Rect as SvgRect, Image as SvgImage } from "react-native-svg";
import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {useState } from "react";
import Navbar from "../../components/navbar";

// charge object type
type Charge = {
  id: number;
  x: number;
  y: number;
  q: number;
  startX?: number;
  startY?: number;
};

function FieldPlot({
  title,
  render
}: {
  title: string;
  render: (w: number, h: number) => React.ReactNode;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View style={styles.containerStyle}>
      <Text style={styles.fieldTitle}>
        {title}
      </Text>

      <View
        style={styles.mapStyle}
        onLayout={e => {
          setSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height
          });
        }}
      >
        {size.width > 0 && size.height > 0 && (
          <Svg width={size.width} height={size.height}>
            {render(size.width, size.height)}
          </Svg>
        )}
      </View>
    </View>
  );
}

export default function App() {

  // states
  const [cards, setCards] = useState<number[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [number, onChangeNumber] = useState('');
  const [showEField, setShowEField] = useState(false);  
  const [showPField, setShowPField] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { width } = useWindowDimensions();
  const [canvas, setCanvas] =
  useState<{x:number,y:number,width:number,height:number} | null>(null);

  // constants
  const isLarge = width > 1000;
  const k = 8.9875517923e9; 

  // utility functions

  // compute potential at (x,y)
  function computePotentialAt(x: number, y: number) {
    let V = 0;

    charges.forEach(c => {
      const dx = x - c.x;
      const dy = y - c.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r === 0) return;

      const q = c.q * 1e-9;
      V += (k * q) / r;
    });

    return V;
  }
  // compute Electric Fields at (x,y)
  function computeElectricFieldAt(x: number, y: number) {
    let Ex = 0;
    let Ey = 0;

    charges.forEach(c => {
      const dx = x - c.x;
      const dy = y - c.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r === 0) return;

      const q = c.q * 1e-9;
      const E = (k * q) / (r * r);

      Ex += E * (dx / r);
      Ey += E * (dy / r);
    });

    return { Ex, Ey };
  }

  // compute Electric Fields at every point
  const renderElectric = (w:number, h:number) => {
    const nodes: any[] = [];
    const step = 30;

    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        const { Ex, Ey } = computeElectricFieldAt(x, y);
        const scale = 200;

        nodes.push(
          <SvgLine
            key={`${x}-${y}`}
            x1={x}
            y1={y}
            x2={x + Ex * scale}
            y2={y + Ey * scale}
            stroke="cyan"
            strokeWidth={5}
          />
        );
      }
    }

    return nodes;
  };

  // compute Potential Fields at every point
  const renderPotential = (w:number,h:number) => {
    const nodes: any[] = [];
    const step = 12;

    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        const V = computePotentialAt(x, y);
        const intensity = Math.min(1, Math.abs(V) / 10);

        nodes.push(
          <SvgRect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={step}
            height={step}
            fill="yellow"
            fillOpacity={intensity}
          />
        );
      }
    }

    return nodes;
  };
  
  // function to add a new charge card
  const addCard = () => {
    if (cards.length >= 5) return; // prevent > 5
    setCards(prev => [...prev, prev.length + 1]);
    setCharges(prev => [...prev, { id: prev.length + 1, x: 150, y: 150, q: 10 }]);
  };

  // function to remove charge card
  const removeCard = (index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
    setCharges(prev => prev.filter((_, i) => i !== index));
  };

  // function for changing polarity
  const changePolarity = (index: number) => {
    setCharges(prev => {
      const copy = [...prev];
      copy[index].q = -copy[index].q;
      return copy;
    });
  };

  // function for adding charge value
  const addCharge = (index: number, value: number) => {
    setCharges(prev => {
      const copy = [...prev];
      let q = Number(value);
      copy[index].q = q;
      return copy;
    });
    console.log(`Change polarity of object ${index + 1}`);
  };

  // function to compute forces on each charge
  function computeForces() {
    return charges.map(c1 => {
      let Fx = 0;
      let Fy = 0;

      charges.forEach(c2 => {
        if (c1.id === c2.id) return;

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;

        const r = Math.sqrt(dx*dx + dy*dy);
        if (r === 0) return;

        const q1 = c1.q * 1e-9;
        const q2 = c2.q * 1e-9;

        const F = (k * q1 * q2) / (r * r);

        const ux = dx / r;
        const uy = dy / r;

        // SIGN handles attraction vs repulsion automatically
        Fx += F * ux;
        Fy += F * uy;
      });

      const magnitude = Math.sqrt(Fx*Fx + Fy*Fy);

      return {
        id: c1.id,
        x: c1.x,
        y: c1.y,
        Fx,
        Fy,
        magnitude
      };
    });
  }
  
  const forceData = computeForces();

  return (
    <SafeAreaProvider
      style={{ backgroundColor: "#EEEEEEff" }}>
        <ScrollView
          scrollEnabled={!dragging}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
        <SafeAreaView
          style={{
            flex: 1,
            flexDirection: isLarge ? "row" : "column",
            flexWrap: "wrap",
          }}
        >
          <Navbar />

          {/* left side */}
          <View style={{width: isLarge ? "38%" : "100%",}}>
            {/* title */}
            <View
              style={styles.containerStyle}
            >
              <Text style={styles.titleText}>
                Colomb's law simulator
              </Text>
            </View>
            {/*Force Display*/}
            <View
              style={styles.containerStyle}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                Force Display
              </Text>
              <Text style={{ fontSize: 15}}>
                Move the charges around to see the forces acting on them.
              </Text>
              <View
                style={styles.canvasStyle}
                onLayout={(e) => setCanvas(e.nativeEvent.layout)}
              >

        {canvas && (
          <>
            {/* Grid and Charges */}
            <Svg
              width={canvas.width}
              height={canvas.height}
              pointerEvents="none"
            >

              {/* Grid */}
              {(() => {
                const spacing = 20;
                const lines = [];
                for (let x = 0; x < canvas.width; x += spacing) {
                  lines.push(
                    <SvgLine
                      key={`v-${x}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={canvas.height}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={1}
                    />
                  );
                }
                for (let y = 0; y < canvas.height; y += spacing) {
                  lines.push(
                    <SvgLine
                      key={`h-${y}`}
                      x1={0}
                      y1={y}
                      x2={canvas.width}
                      y2={y}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={1}
                    />
                  );
                }
                return lines;
              })()}

              {/* Charges*/}
              {charges.map(c => {
                const src =
                  c.q > 0
                    ? require("../../assets/images/positive.png")
                    : require("../../assets/images/negative.png");

                return (
                  <SvgImage
                    key={c.id}
                    x={c.x}
                    y={c.y}
                    width={20}
                    height={20}
                    href={src}
                  />
                );
              })}
            </Svg>

            {/* Drag Touch Logic*/}
            {charges.map(c => {
              const pan = Gesture.Pan()
                .onBegin(() => {
                  setDragging(true);
                  setCharges(prev =>
                    prev.map(ch =>
                      ch.id === c.id
                        ? { ...ch, startX: ch.x, startY: ch.y }
                        : ch
                    )
                  );
                })
                .onUpdate(e => {
                  if (!canvas) return;

                  setCharges(prev =>
                    prev.map(ch =>
                      ch.id === c.id
                        ? {
                            ...ch,
                            x: Math.max(
                              0,
                              Math.min(
                                canvas.width - 20,
                                (ch.startX ?? ch.x) + e.translationX
                              )
                            ),
                            y: Math.max(
                              0,
                              Math.min(
                                canvas.height - 20,
                                (ch.startY ?? ch.y) + e.translationY
                              )
                            ),
                          }
                        : ch
                    )
                  );
                })
                .onEnd(() => {
                  setDragging(false);
                  setCharges(prev =>
                    prev.map(ch =>
                      ch.id === c.id
                        ? { ...ch, startX: undefined, startY: undefined }
                        : ch
                    )
                  );
                })
                .runOnJS(true);

                return (
                    <GestureDetector key={c.id} gesture={pan}>
                      <View
                        style={{
                          position: "absolute",
                          width: 20,
                          height: 20,
                          left: c.x,
                          top: c.y,
                        }}
                      />
                    </GestureDetector>
                  );
                })}
          </>
        )}


      </View>
      {/*Object Measurements*/}
      <View style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        backgroundColor: "#002467ff",
      }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
          Object Measurements
        </Text>

        {forceData.map(f => (
          <View key={f.id} style={styles.objectMeasurement}>
            <Text style={{ fontSize: 15, fontWeight: "bold" }}>
              Object {f.id}
            </Text>

            <Text>
              <Text>
              Position : ( {Math.round(f.x)} , 
                          {canvas ? Math.round(canvas.height - f.y - 20) : Math.round(f.y)} )
            </Text>

            </Text>

            <Text>
              Fx : {f.Fx.toExponential(2)} N , Fy : {f.Fy.toExponential(2)} N
            </Text>

            <Text>
              |F| : {f.magnitude.toExponential(2)} N
            </Text>
          </View>
            ))}
          </View>
          </View>
          {showEField && (
            <FieldPlot title="Electric Field" render={(w,h)=>renderElectric(w,h)} />
          )}

          {showPField && (
            <FieldPlot title="Potential Field" render={(w,h)=>renderPotential(w,h)} />
          )}




        </View>


          {/* right side */}
          <View style={{width: isLarge ? "56%" : "100%",}}>
            {/*Add Button Card*/}
            <View
              style={styles.containerStyle}
            >
              <View
                style={styles.plusIconSeperator}
              >
                <Text style={styles.titleText}>
                  Add up to 5 objects
                </Text>

                <Pressable onPress={addCard}>
                  <RNImage
                    source={require("../../assets/images/plus-butt.png")}
                    style={styles.plusIcon}
                  />
                </Pressable>
              </View>
            </View>

            {/*Generated Cards*/}
              {cards.map((c, index) => {
                const polarIcon =
                  charges[index].q > 0
                    ? require("../../assets/images/positive.png")
                    : require("../../assets/images/negative.png");

                return (
                  <View
                    key={index}
                    style={styles.containerStyle}
                  >
                    {/* Header row */}
                    <View
                      style={styles.plusIconSeperator}
                    >
                      <Text style={styles.subtitleText}>
                        Object {index + 1}
                      </Text>

                      <Pressable onPress={() => removeCard(index)}>
                        <RNImage
                          source={require("../../assets/images/x.png")}
                          style={styles.xicon}
                        />
                      </Pressable>
                    </View>

                    {/* Charge */}
                    <Text style={styles.chargeText}>
                      Charge     : <TextInput
                    style={styles.textInputStyle}
                    keyboardType="numeric"
                    value={String(charges[index].q)}
                    onChangeText={(text) => {
                      onChangeNumber(text);
                      const num = Number(text);
                      addCharge(index, isNaN(num) ? 0.01 : num);
                    }}
                    placeholder="5"
                  /> nC
                    </Text>

                    {/* Polarity */}
                    <View
                      style={styles.polarButtonSeparator}
                    >
                      <Text style={{ fontSize: 15 }}>
                        Polarity     :
                      </Text>

                      <Pressable onPress={() => changePolarity(index)}>
                        <RNImage
                          source={polarIcon}
                          style={styles.polarButton}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
          {/*Electric Fields and Potential Fields*/}
          <View
            style={styles.containerStyle}
          >
            <View style={styles.slideButtonSeperator}>
              <Text style={styles.subtitleText}>
                Show Electric Fields :
              </Text>

              <Switch
                trackColor={{ false: "#c1c1c1ff", true: "#00ff0dff" }}
                thumbColor={showEField ? "#009b08ff" : "#f4f3f4"}
                value={showEField}
                onValueChange={setShowEField}
              />
            </View>

            <View style={styles.slideButtonSeperator}>
              <Text style={styles.subtitleText}>
                Show Potential Fields :
              </Text>

              <Switch
                trackColor={{ false: "#c1c1c1ff", true: "#00ff0dff" }}
                thumbColor={showPField ? "#009b08ff" : "#f4f3f4"}
                value={showPField}
                onValueChange={setShowPField}
              />
            </View>
          </View>
        </View>
        </SafeAreaView>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mapStyle: { 
    height: 320, 
    borderRadius: 12, 
    overflow: "hidden", 
    backgroundColor: "#ee00ffff" 
  },
  containerStyle: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    fontSize: 15,
  },
  chargeText: {
    fontSize: 15,
    paddingTop: 16,
    paddingBottom: 8,
  },
  canvasStyle: {
    marginTop: 10,
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
    position: "relative",
  },
  objectMeasurement: {
    backgroundColor: "#ffffffff",
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  plusIconSeperator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slideButtonSeperator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  plusIcon: {
    width: 30,
    height: 30,
  },
  xicon:{
    width: 20,
    height: 20,
  },
  textInputStyle:{
    marginLeft: 24,
    width: 70,
    height: 36,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 6,
    paddingHorizontal: 8,
    backgroundColor: "white",
  },
  polarButtonSeparator:{
    flexDirection: "row",
    alignItems: "center",
  },
  polarButton:{
    width: 20,
    height: 20,
    marginLeft: 24,
  },
  fieldTitle:{
    fontSize: 24,
    fontWeight: "bold", 
    marginBottom: 10, 
  },
  safeViewStyle:{

  }

});