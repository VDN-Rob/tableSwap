
import React, { useEffect, useState } from "react";
import {
	Animated,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Screen = "setup" | "seats" | "draw" | "confirmation";

const DEFAULT_SEATS = 10;
const DEFAULT_EMPTY = [3, 6, 9];
const MAX_SEATS = 40;

export default function App() {
	const [screen, setScreen] = useState<Screen>("setup");

	// Setup configuration
	const [draftCount, setDraftCount] = useState(DEFAULT_SEATS);
	const [draftEmpty, setDraftEmpty] = useState<number[]>(DEFAULT_EMPTY);

	// Active seating arrangement
	const [seatCount, setSeatCount] = useState(DEFAULT_SEATS);
	const [emptySeats, setEmptySeats] = useState<number[]>(DEFAULT_EMPTY);

	// Current draw
	const [drawFrom, setDrawFrom] = useState<number | null>(null);
	const [drawTo, setDrawTo] = useState<number | null>(null);
	const [drawPool, setDrawPool] = useState<number[]>([]);
	const [displayNumber, setDisplayNumber] = useState<number | null>(null);

	const fade = React.useRef(new Animated.Value(0.4)).current;
	const scale = React.useRef(new Animated.Value(0.8)).current;

	const seats = Array.from({ length: seatCount }, (_, i) => i + 1);
	const setupSeats = Array.from(
		{ length: draftCount },
		(_, i) => i + 1
	);

	// Run the draw animation, then reveal the actual destination.
	useEffect(() => {
		if (
		screen !== "draw" ||
		drawFrom === null ||
		drawTo === null ||
		drawPool.length === 0
		) {
		return;
		}

		let finished = false;

		const interval = setInterval(() => {
		setDisplayNumber(
			drawPool[Math.floor(Math.random() * drawPool.length)]
		);
		}, 90);

		const timeout = setTimeout(() => {
		finished = true;
		clearInterval(interval);

		// Commit the move once the draw is finished.
		setEmptySeats((current) =>
			current.filter((s) => s !== drawTo).concat(drawFrom)
		);

		setDisplayNumber(drawTo);
		setScreen("confirmation");

		fade.setValue(0.4);
		scale.setValue(0.8);

		Animated.parallel([
			Animated.timing(fade, {
			toValue: 1,
			duration: 350,
			useNativeDriver: true,
			}),
			Animated.spring(scale, {
			toValue: 1,
			useNativeDriver: true,
			}),
		]).start();
		}, 1800);

		return () => {
		clearInterval(interval);
		clearTimeout(timeout);
		if (!finished) {
			setDisplayNumber(null);
		}
		};
	}, [screen, drawFrom, drawTo, drawPool, fade, scale]);

	function changeSeatCount(next: number) {
		const count = Math.max(2, Math.min(MAX_SEATS, next));
		setDraftCount(count);
		setDraftEmpty((current) =>
		current.filter((seat) => seat <= count)
		);
	}

	function toggleInitialEmpty(seat: number) {
		setDraftEmpty((current) =>
		current.includes(seat)
			? current.filter((s) => s !== seat)
			: [...current, seat].sort((a, b) => a - b)
		);
	}

	function startSession() {
		if (draftEmpty.length === 0 || draftEmpty.length >= draftCount) {
		return;
		}

		setSeatCount(draftCount);
		setEmptySeats([...draftEmpty]);
		setDrawFrom(null);
		setDrawTo(null);
		setDisplayNumber(null);
		setScreen("seats");
	}

	function beginDraw(seat: number) {
		if (emptySeats.includes(seat) || emptySeats.length === 0) {
		return;
		}

		// Freeze the pool and choose the destination once.
		const pool = [...emptySeats];
		const destination =
		pool[Math.floor(Math.random() * pool.length)];

		setDrawFrom(seat);
		setDrawPool(pool);
		setDrawTo(destination);
		setDisplayNumber(pool[0]);
		setScreen("draw");
	}

	function backToSeats() {
		setDrawFrom(null);
		setDrawTo(null);
		setDrawPool([]);
		setDisplayNumber(null);
		setScreen("seats");
	}

	function editSetup() {
		setDraftCount(seatCount);
		setDraftEmpty([...emptySeats]);
		setScreen("setup");
	}

	function renderSeat(
		seat: number,
		empty: boolean,
		onPress?: () => void,
		selectable = false
	) {
		return (
		<Pressable
			key={seat}
			disabled={!selectable}
			onPress={onPress}
			style={[
			styles.seat,
			empty ? styles.emptySeat : styles.occupiedSeat,
			selectable && styles.selectable,
			]}
		>
			<Text
			style={[
				styles.seatNumber,
				empty && styles.emptyText,
			]}
			>
			{seat}
			</Text>
			<Text
			style={[
				styles.seatLabel,
				empty && styles.emptyText,
			]}
			>
			{empty ? "EMPTY" : "TAKEN"}
			</Text>
		</Pressable>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
		<ScrollView contentContainerStyle={styles.content}>
			<Text style={styles.eyebrow}>{DUTCH_STRINGS.eyebrow}</Text>
			<Text style={styles.title}>{DUTCH_STRINGS.title}</Text>

			{screen === "setup" && (
			<>
				<Text style={styles.subtitle}>
					{DUTCH_STRINGS.setupSubtitle}
				</Text>

				<View style={styles.panel}>
				<Text style={styles.sectionTitle}>{DUTCH_STRINGS.numberOfSeats}</Text>

				<View style={styles.counter}>
					<Pressable
					style={styles.counterButton}
					onPress={() => changeSeatCount(draftCount - 1)}
					>
					<Text style={styles.counterText}>−</Text>
					</Pressable>

					<Text style={styles.counterValue}>{draftCount}</Text>

					<Pressable
					style={styles.counterButton}
					onPress={() => changeSeatCount(draftCount + 1)}
					>
					<Text style={styles.counterText}>+</Text>
					</Pressable>
				</View>

				<Text style={styles.sectionTitle}>
					{DUTCH_STRINGS.initiallyEmpty}
				</Text>
				<Text style={styles.hint}>
					{DUTCH_STRINGS.emptyHint}
				</Text>

				<View style={styles.grid}>
					{setupSeats.map((seat) =>
					renderSeat(
						seat,
						draftEmpty.includes(seat),
						() => toggleInitialEmpty(seat),
						true
					)
					)}
				</View>

				<Text style={styles.hint}>
					{draftEmpty.length} lege stoel
					{draftEmpty.length === 1 ? "" : "en"} geselecteerd
				</Text>

				<Pressable
					disabled={
					draftEmpty.length === 0 ||
					draftEmpty.length >= draftCount
					}
					style={[
					styles.primaryButton,
					(draftEmpty.length === 0 ||
						draftEmpty.length >= draftCount) &&
						styles.disabledButton,
					]}
					onPress={startSession}
				>
					<Text style={styles.primaryText}>
						{DUTCH_STRINGS.startFeast}
					</Text>
				</Pressable>
				</View>
			</>
			)}

			{screen === "seats" && (
			<>
				<Text style={styles.subtitle}>
					{DUTCH_STRINGS.selectionSubtitle}
				</Text>

				<View style={styles.legend}>
				<Text style={styles.legendText}>{DUTCH_STRINGS.taken}</Text>
				<Text style={[styles.legendText, { color: "#A16E17" }]}>
					{DUTCH_STRINGS.empty}
				</Text>
				</View>

				<View style={styles.grid}>
				{seats.map((seat) =>
					renderSeat(
					seat,
					emptySeats.includes(seat),
					() => beginDraw(seat),
					!emptySeats.includes(seat)
					)
				)}
				</View>

				<View style={styles.infoCard}>
				<Text style={styles.infoTitle}>
					{emptySeats.length} {DUTCH_STRINGS.availableDestination}
					{emptySeats.length === 1 ? "" : "en"}
				</Text>
				<Text style={styles.hint}>
					{DUTCH_STRINGS.moveHint}
				</Text>
				</View>

				<Pressable
				style={styles.secondaryButton}
				onPress={editSetup}
				>
				<Text style={styles.secondaryText}>{DUTCH_STRINGS.editSetup}</Text>
				</Pressable>
			</>
			)}

			{screen === "draw" && (
			<View style={styles.centerStage}>
				<Text style={styles.subtitle}>{DUTCH_STRINGS.drawingSubtitle}</Text>

				<View style={styles.drawCircle}>
				<Text style={styles.drawLabel}>{DUTCH_STRINGS.yourNextSeat}</Text>
				<Text style={styles.drawNumber}>{displayNumber ?? "?"}</Text>
				</View>

				<Text style={styles.hint}>
					{DUTCH_STRINGS.fateHint}
				</Text>
			</View>
			)}

			{screen === "confirmation" && drawTo !== null && (
			<View style={styles.centerStage}>
				<Text style={styles.successTitle}>{DUTCH_STRINGS.decided}</Text>

				<Animated.View
				style={[
					styles.resultCard,
					{
					opacity: fade,
					transform: [{ scale }],
					},
				]}
				>
				<Text style={styles.resultLabel}>{DUTCH_STRINGS.newSeat}</Text>
				<Text style={styles.resultNumber}>{drawTo}</Text>
				<Text style={styles.resultDescription}>
					{DUTCH_STRINGS.leaveSeat} {drawFrom} {DUTCH_STRINGS.headToSeat} {drawTo}.
				</Text>
				</Animated.View>

				<Text style={styles.hint}>
					{DUTCH_STRINGS.rememberHint}
				</Text>

				<Pressable
				style={styles.primaryButton}
				onPress={backToSeats}
				>
				<Text style={styles.primaryText}>
					{DUTCH_STRINGS.confirm}
				</Text>
				</Pressable>
			</View>
			)}

			<Text style={styles.footer}>{DUTCH_STRINGS.footer}</Text>
		</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F8F7F2",
	},
	content: {
		padding: 22,
		paddingTop: 32,
		paddingBottom: 40,
	},
	eyebrow: {
		textAlign: "center",
		letterSpacing: 3,
		fontSize: 11,
		fontWeight: "800",
		color: "#A16E17",
	},
	title: {
		fontSize: 34,
		fontWeight: "900",
		color: "#25372C",
		textAlign: "center",
		marginTop: 8,
	},
	subtitle: {
		fontSize: 16,
		lineHeight: 24,
		color: "#68736A",
		textAlign: "center",
		marginTop: 12,
		marginBottom: 24,
	},
	panel: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 18,
		gap: 18,
	},
	sectionTitle: {
		fontSize: 17,
		fontWeight: "800",
		color: "#25372C",
	},
	counter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 32,
	},
	counterButton: {
		width: 48,
		height: 48,
		borderRadius: 15,
		backgroundColor: "#E5EDE2",
		alignItems: "center",
		justifyContent: "center",
	},
	counterText: {
		fontSize: 28,
		color: "#25372C",
		fontWeight: "700",
	},
	counterValue: {
		fontSize: 30,
		fontWeight: "900",
		color: "#25372C",
		minWidth: 48,
		textAlign: "center",
	},
	hint: {
		fontSize: 13,
		lineHeight: 20,
		color: "#7A817A",
		textAlign: "center",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: 10,
	},
	seat: {
		width: "29%",
		minHeight: 76,
		borderRadius: 15,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	selectable: {
		borderColor: "#FFFFFF",
	},
	occupiedSeat: {
		backgroundColor: "#426B50",
		borderColor: "#426B50",
	},
	emptySeat: {
		backgroundColor: "#FFF0CF",
		borderColor: "#E6B95C",
	},
	seatNumber: {
		color: "#FFFFFF",
		fontSize: 25,
		fontWeight: "900",
	},
	seatLabel: {
		fontSize: 9,
		fontWeight: "800",
		color: "#FFFFFF",
		marginTop: 3,
	},
	emptyText: {
		color: "#76551B",
	},
	primaryButton: {
		backgroundColor: "#426B50",
		paddingVertical: 17,
		paddingHorizontal: 18,
		borderRadius: 16,
		alignItems: "center",
		marginTop: 12,
	},
	disabledButton: {
		opacity: 0.4,
	},
	primaryText: {
		color: "#FFFFFF",
		fontSize: 15,
		fontWeight: "800",
		textAlign: "center",
	},
	secondaryButton: {
		alignSelf: "center",
		padding: 16,
		marginTop: 8,
	},
	secondaryText: {
		color: "#426B50",
		fontWeight: "700",
	},
	legend: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 20,
		marginBottom: 18,
	},
	legendText: {
		color: "#426B50",
		fontWeight: "700",
		fontSize: 13,
	},
	infoCard: {
		backgroundColor: "#E5EDE2",
		borderRadius: 18,
		padding: 18,
		marginTop: 24,
		gap: 8,
	},
	infoTitle: {
		fontSize: 17,
		fontWeight: "800",
		textAlign: "center",
		color: "#25372C",
	},
	centerStage: {
		alignItems: "center",
		marginTop: 36,
	},
	drawCircle: {
		width: 230,
		height: 230,
		borderRadius: 115,
		backgroundColor: "#E5EDE2",
		borderWidth: 5,
		borderColor: "#426B50",
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 24,
	},
	drawLabel: {
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 2,
		color: "#426B50",
	},
	drawNumber: {
		fontSize: 86,
		fontWeight: "900",
		color: "#25372C",
	},
	successTitle: {
		fontSize: 27,
		fontWeight: "900",
		color: "#25372C",
		marginBottom: 24,
	},
	resultCard: {
		backgroundColor: "#E5EDE2",
		borderRadius: 26,
		padding: 28,
		width: "100%",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#426B50",
	},
	resultLabel: {
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 2,
		color: "#426B50",
	},
	resultNumber: {
		fontSize: 100,
		lineHeight: 115,
		fontWeight: "900",
		color: "#25372C",
	},
	resultDescription: {
		textAlign: "center",
		fontSize: 16,
		lineHeight: 25,
		color: "#425448",
	},
	footer: {
		textAlign: "center",
		marginTop: 36,
		fontSize: 12,
		color: "#92978F",
	},
});


const DUTCH_STRINGS = {
  eyebrow: "FAMILIEFEEST",
  title: "Stoelendans",
  setupSubtitle:
    "Stel de tafel in voordat iedereen gaat zitten.",

  numberOfSeats: "1. Aantal zitplaatsen",
  initiallyEmpty: "2. Kies de lege zitplaatsen",
  emptyHint:
    "Tik op een stoel om deze als leeg of bezet te markeren.",
  emptySelected: "lege stoel(en) geselecteerd",
  startFeast: "Start het feest →",

  selectionSubtitle:
    "Wie komt er hier naar het buffet? Tik op uw huidige stoel.",
  taken: "● BEZET",
  empty: "● LEEG",
  availableDestination: "beschikbare bestemming",
  moveHint:
    "Bij elke wissel komt de stoel waarop iemand zat weer vrij.",
  editSetup: "Instellingen wijzigen",

  drawingSubtitle: "Je nieuwe stoel wordt getrokken…",
  yourNextSeat: "JOUW NIEUWE STOEL",
  fateHint: "Laat het lot bepalen waar je gaat zitten!",

  decided: "Het is beslist!",
  newSeat: "JOUW NIEUWE STOEL",
  leaveSeat: "Laat stoel",
  headToSeat: "achter en ga naar stoel",
  rememberHint:
    "Onthoud je nieuwe stoelnummer voordat je verdergaat.",
  confirm: "Begrepen — terug naar de tafel",

  footer: "Een nieuwe stoel, een nieuw gesprek.",
};
