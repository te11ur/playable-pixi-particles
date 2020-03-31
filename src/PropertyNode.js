import {hexToRGB} from "./ParticleUtils";

export class ValueStep {
	value;
	time;
}

export class ValueList {
	list;
	isStepped;
	ease;
}
/**
 * A single node in a PropertyList.
 */
export class PropertyNode
{
	/**
	 * Value for the node.
	 */
	value;
	/**
	 * Time value for the node. Between 0-1.
	 */
	time;
	/**
	 * The next node in line.
	 */
	next;
	/**
	 * If this is the first node in the list, controls if the entire list is stepped or not.
	 */
	isStepped;
	ease;
	
	/**
	 * @param value The value for this node
	 * @param time The time for this node, between 0-1
	 * @param [ease] Custom ease for this list. Only relevant for the first node.
	 */
	constructor(value, time, ease)
	{
		this.value = value;
		this.time = time;
		this.next = null;
		this.isStepped = false;
		if (ease)
		{
			this.ease = typeof ease == "function" ? ease : generateEase(ease);
		}
		else
		{
			this.ease = null;
		}
	}

	/**
	 * Creates a list of property values from a data object {list, isStepped} with a list of objects in
	 * the form {value, time}. Alternatively, the data object can be in the deprecated form of
	 * {start, end}.
	 * @param data The data for the list.
	 * @param data.list The array of value and time objects.
	 * @param data.isStepped If the list is stepped rather than interpolated.
	 * @param data.ease Custom ease for this list.
	 * @return The first node in the list
	 */
	static createList(data)
	{
		if ("list" in data)
		{
			let array = data.list;
			let node, first;
			const {value, time} = array[0];
			first = node = new PropertyNode(typeof value === 'string' ? hexToRGB(value) : value, time, data.ease);
			//only set up subsequent nodes if there are a bunch or the 2nd one is different from the first
			if (array.length > 2 || (array.length === 2 && array[1].value !== value))
			{
				for (let i = 1; i < array.length; ++i)
				{
					const {value, time} = array[i];
					node.next = new PropertyNode(typeof value === 'string' ? hexToRGB(value) : value, time);
					node = node.next;
				}
			}
			first.isStepped = !!data.isStepped;
			return first;
		}
		else
		{
			//Handle deprecated version here
			let start = new PropertyNode(typeof data.start === 'string' ? hexToRGB(data.start) : data.start, 0);
			//only set up a next value if it is different from the starting value
			if (data.end !== data.start)
				start.next = new PropertyNode(typeof data.end === 'string' ? hexToRGB(data.end) : data.end, 1);
			return start;
		}
	}
}