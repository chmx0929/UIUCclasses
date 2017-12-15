import java.io.*;
import java.util.*;
import java.lang.*;
public class Main
{
public static void main(String args[]) throws Exception
	{
		Scanner cin=new Scanner(System.in);
		String data = cin.nextLine();		
		while (!data.equals("*")) 
		{
			String[] parts = data.split("");
			int length = parts.length;
			boolean surprising = true;
			for (int i=1; i<length; i++) 
			{
				Map library = new HashMap();
				for (int j=0; j<length-i; j++) {
					if (library.containsKey(parts[j].concat(parts[j+i]))) 
					{
						surprising = false;
						break;
					}else
					{
						library.put(parts[j].concat(parts[j+i]),1);
					}
				}
				if (surprising==false)
				{
					break;
				}
			}
			if (surprising) 
			{
				System.out.println(data+" is surprising.");
			}else
			{
				System.out.println(data+" is NOT surprising.");
			}
			data = cin.nextLine();
		}
	}
}